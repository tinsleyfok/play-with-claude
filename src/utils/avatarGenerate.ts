/**
 * Stylize an uploaded photo into a black-ink brush-doodle avatar.
 *
 * Resolution order (fastest available wins):
 *   1. `VITE_OPENAI_API_KEY` set → call `gpt-image-1` (`/v1/images/edits`) directly from the browser
 *      with the user's image only (prompt carries the style).
 *   2. `VITE_AVATAR_GEN_ENDPOINT` set → POST `multipart/form-data { image, style }` to your proxy and
 *      expect an image binary back (works with Replicate/fal/etc).
 *   3. Neither set → return the uploaded image as-is so the UI keeps working in dev (`fallback: true`).
 *
 * Direct browser → OpenAI exposes the API key in your bundle. Use it locally with `.env.local`,
 * and switch to a small proxy (#2) before deploying publicly.
 */
export type GenerateAvatarResult = {
  /** Object URL or remote URL the UI can render. Caller revokes if `revoke` is true. */
  url: string;
  /** True when this util created the blob URL and the caller should revoke it later. */
  revoke: boolean;
  /** True when no AI ran and the value is just the unmodified upload. */
  fallback: boolean;
};

const OPENAI_KEY = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)?.trim() || "";
const PROXY_ENDPOINT = (import.meta.env.VITE_AVATAR_GEN_ENDPOINT as string | undefined)?.trim() || "";

/**
 * `true` whenever any stylization backend is configured: either the direct OpenAI
 * key (dev only) or the password-gated proxy (production). The UI uses this to
 * decide whether to render the Upload / Generate flow at all.
 */
export const AVATAR_AI_AVAILABLE = Boolean(OPENAI_KEY || PROXY_ENDPOINT);

/**
 * `true` when the configured backend is the proxy. The Avatar page uses this to
 * gate the Upload/Generate flow behind a password prompt — the proxy validates
 * the password and only it holds the real OpenAI key.
 */
export const AVATAR_AI_REQUIRES_PASSWORD = !OPENAI_KEY && Boolean(PROXY_ENDPOINT);

/** Thrown when the proxy rejects the password (HTTP 401). The UI clears the cached password. */
export class AvatarAuthError extends Error {
  constructor(message = "Invalid or missing password.") {
    super(message);
    this.name = "AvatarAuthError";
  }
}

const STYLE_PROMPT = [
  "Redraw the main subject from this photo as an EXTREMELY MINIMAL hand-drawn doodle, drawn with a medium-weight black felt-tip pen / brush pen — chunky enough to feel confident, but NOT a fat poster marker.",
  "Use a fully transparent background (no paper, no white fill, no border) — only the black ink marks.",
  "Default line weight is MEDIUM (think a 2–3 mm felt-tip / Tombow brush pen). Lines should feel solid, friendly, and slightly chunky, but never as thick as a Sharpie or poster marker. The overall avatar should read clearly at a small size.",
  "Allow visible weight variation: features like eyes, eyebrows, lips, a closed eye line can be slightly bolder or filled in; outline strokes can swell a little at curves and taper at the ends. Avoid pencil-thin lines, but also avoid uniform thick poster outlines.",
  "Strokes feel hand-drawn with natural taper and small imperfections, like a quick brush-pen doodle in a sketchbook — confident and bouncy, not stiff vector outlines.",
  "Style anchors: medium-weight brush-pen doodle, friendly minimal portrait, simple cute character icon. Avoid: hairline fineliner, heavy sumi-e wash, fat uniform Sharpie outlines, woodcut, bold poster style.",
  "Hard limits on texture: do NOT draw fur strands packed together, dense hatching, cross-hatching, shading, dotted noise, scribbled beard, or repeated parallel marks. Hair is drawn as a few flowing lines, never as packed strands.",
  "Captions / signatures / watermarks / text / speech bubbles / frames are NEVER allowed.",
  "Whether decorative cute accents (kawaii star eyes, a single tiny heart, a few small dots on a headband, a small sparkle) are allowed depends on the complexity rule below — they are FORBIDDEN at SIMPLE, ALLOWED in tiny doses at MEDIUM, and FORBIDDEN again at COMPLEX. Follow the rule strictly.",
  "Total line count target: roughly 8 to 25 individual strokes for the entire avatar — fewer is better. If in doubt, leave it out.",
  "No color, no shading, no gradients, no outline frame, no signature.",
  "Subject type (must not mix these up): decide whether the photo is primarily (A) an adult woman, (B) an adult man, (C) a dog, (D) a cat, or (E) another animal.",
  "Preserve that type exactly. Do not give a dog or cat a human face, human hairline, or human ears; do not give a human a snout, whisker pads, or pointed pet ears.",
  "For women or men: keep human eyes, nose, mouth, and apparent gender presentation consistent with the photo. Hair, jaw, and accessories are OPTIONAL and decided by the complexity rule below.",
  "For dogs: canine muzzle, nose, eyes, and ear shape — readable as a dog, not a cat or person. Fur and accessories are decided by the complexity rule below.",
  "For cats: feline eye shape, small nose, whisker hints if visible, and ear shape — readable as a cat, not a dog or person. Fur and accessories are decided by the complexity rule below.",
  "For other animals: keep a species-correct head only, no anthropomorphic human face.",
  "Match the subject's expression from the photo.",
  "Center the doodle as a square 1024x1024 image suitable for a circular avatar.",
  "The complexity rule that follows is the AUTHORITATIVE decision on what to include or omit — it overrides any default urge to add or remove details.",
].join(" ");

/**
 * Three discrete steps from the UI slider: 0 = Simple, 50 = Medium, 100 = Complex.
 *   - SIMPLE  → only eyes, nose, mouth. Nothing else. ~6–10 strokes.
 *   - MEDIUM  → SIMPLE + ONE accessory area from the photo (e.g. hair, hairband+hair, hat, glasses). ~10–16 strokes.
 *   - COMPLEX → MEDIUM, plus extra accessories ONLY when clearly visible in the photo. ~12–18 strokes.
 *               No kawaii decorations here, and NEVER invents items the photo does not show.
 */
function complexityInstruction(complexity: number): string {
  const n = Math.max(0, Math.min(100, Math.round(complexity)));
  const tier: "simple" | "medium" | "complex" = n <= 25 ? "simple" : n <= 75 ? "medium" : "complex";

  if (tier === "simple") {
    return [
      `Follow the SIMPLE complexity level (slider ${n}/100).`,
      "Draw ONLY three features as floating black ink shapes: two eyes, a nose, and a mouth (for animals: two eyes, a nose, and a small mouth/muzzle line). Nothing else.",
      "Do NOT draw a head outline, face shape, hair, fur, ears, neck, body, hat, glasses, earrings, hearts, whiskers, or any decoration.",
      "Target around 6 to 10 strokes total. Keep the marks roughly arranged like a face with empty space everywhere else; the background must stay fully transparent.",
    ].join(" ");
  }

  if (tier === "medium") {
    return [
      `Follow the MEDIUM complexity level (slider ${n}/100). The vibe is a cute kawaii doodle — friendly, expressive, and slightly stylized.`,
      "Draw eyes, nose, mouth, AND exactly ONE accessory area chosen from the photo. Pick the single most visually defining feature on the head, e.g. hair, hair-with-headband, hair-with-hat, glasses, or a hat — these all count as ONE area. Hair must be a few flowing lines (3–6 wavy strands max), not a packed silhouette and not packed strands.",
      "Stylized cute features are ALLOWED here in a tiny dose: eyes may be drawn as kawaii shapes such as small filled stars, sparkles, closed-eye U / arc shapes, or simple dots. You may also add at MOST ONE tiny heart near the cheek/mouth, AND up to a few small dots on the chosen accessory (e.g. polka dots on a headband). Nothing else.",
      "Limits: at most 1 heart, at most 1 set of stylized eyes, at most a small handful of decorative dots. Do NOT add multiple hearts, sparkles, stars, swirls, flowers, blush marks, or any other decoration.",
      "Other accessories are NOT allowed (no extra earrings, no scarf, no glasses if you already chose hair, etc.). No texture/hatching inside any silhouette.",
      "Target around 12 to 20 strokes total.",
    ].join(" ");
  }

  return [
    `Follow the COMPLEX complexity level (slider ${n}/100).`,
    "COMPLEX is NOT a license to add more. Start from the MEDIUM result (eyes, nose, mouth, plus ONE hair/hat/headband/glasses area) and only add MORE shapes when you can point to them in the source photo with high confidence.",
    "Hard rule: every single stroke you draw must depict something that is unambiguously visible in the source photo. If a shape is not clearly there, do NOT draw it. When in doubt, leave it out — fewer strokes is always better than guessing.",
    "Absolute bans (these are NEVER added at COMPLEX, even if they would look cute): no hearts, no stars, no sparkles, no decorative dots, no flowers, no blush marks, no swirls, no pattern fills, no extra hair strands, no extra earrings, no extra piercings, no necklaces unless clearly worn in the photo, no glasses unless actually on the face in the photo, no sunglasses on top of the head unless they are literally there in the photo, no scarves/collars unless visible, no makeup marks, no kawaii eye styles (no star eyes, no sparkle eyes — just plain dot/oval eyes like in MEDIUM minus the cute add-on).",
    "Texture bans (still apply): NO fur strands, NO hair strands, NO hatching, NO cross-hatching, NO multi-line shading, NO beard scribble, NO repeated parallel marks. Hair stays as a few flowing outline lines.",
    "Target around 12 to 18 strokes total — only slightly more than MEDIUM, never a detailed illustration. If you cannot honestly justify adding a shape from the photo, stop at the MEDIUM count. One centered head, transparent background, no body, no scene.",
  ].join(" ");
}

function buildStylizePrompt(complexity: number): string {
  return `${STYLE_PROMPT} ${complexityInstruction(complexity)}`;
}

function base64ToBlob(b64: string, type = "image/png"): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

async function callOpenAI(file: File, complexity: number, signal?: AbortSignal): Promise<Blob> {
  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("prompt", buildStylizePrompt(complexity));
  form.append("image", file);
  form.append("n", "1");
  form.append("size", "1024x1024");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: form,
    signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    let friendly = detail || res.statusText;
    try {
      const parsed = JSON.parse(detail) as { error?: { message?: string } };
      if (parsed.error?.message) friendly = parsed.error.message;
    } catch {
      // raw text fallback
    }
    throw new Error(`OpenAI ${res.status}: ${friendly}`);
  }
  const json = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
  const item = json.data?.[0];
  if (!item) throw new Error("OpenAI response missing data");
  if (item.b64_json) return base64ToBlob(item.b64_json);
  if (item.url) {
    const r = await fetch(item.url, { signal });
    if (!r.ok) throw new Error(`Failed to download generated image (${r.status})`);
    return await r.blob();
  }
  throw new Error("OpenAI response missing image");
}

async function callProxy(
  file: File,
  complexity: number,
  password: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const form = new FormData();
  form.append("image", file);
  form.append("prompt", buildStylizePrompt(complexity));
  form.append("size", "1024x1024");
  form.append("model", "gpt-image-1");

  const res = await fetch(PROXY_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${password}` },
    body: form,
    signal,
  });

  if (res.status === 401) {
    let msg = "Invalid or missing password.";
    try {
      const parsed = (await res.json()) as { error?: string };
      if (parsed.error) msg = parsed.error;
    } catch {
      // ignore
    }
    throw new AvatarAuthError(msg);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    let friendly = detail || res.statusText;
    try {
      const parsed = JSON.parse(detail) as { error?: string };
      if (parsed.error) friendly = parsed.error;
    } catch {
      // raw text fallback
    }
    throw new Error(`Proxy ${res.status}: ${friendly}`);
  }

  return await res.blob();
}

/**
 * @param complexity 0–100, same scale as the Avatar page slider (tiers at 34 and 67).
 * @param password   Required when `AVATAR_AI_REQUIRES_PASSWORD` is true; ignored otherwise.
 *                   On HTTP 401 the function throws `AvatarAuthError` so the UI can re-prompt.
 */
export async function generateStylizedAvatar(
  file: File,
  signal?: AbortSignal,
  complexity: number = 50,
  password?: string,
): Promise<GenerateAvatarResult> {
  if (OPENAI_KEY) {
    const blob = await callOpenAI(file, complexity, signal);
    return { url: URL.createObjectURL(blob), revoke: true, fallback: false };
  }
  if (PROXY_ENDPOINT) {
    if (!password) throw new AvatarAuthError("Password required.");
    const blob = await callProxy(file, complexity, password, signal);
    return { url: URL.createObjectURL(blob), revoke: true, fallback: false };
  }
  return { url: URL.createObjectURL(file), revoke: true, fallback: true };
}
