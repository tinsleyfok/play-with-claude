/**
 * Avatar stylization proxy for the TinsleyToolbox GitHub Pages site.
 *
 * Contract (matches the frontend's `callProxy` in `src/utils/avatarGenerate.ts`):
 *   POST /
 *   Headers:
 *     Authorization: Bearer <UNLOCK_PASSWORD>
 *   Body (multipart/form-data):
 *     image:    File          - the user's photo
 *     prompt:   string         - full stylization prompt
 *     size?:    string         - default "1024x1024"
 *     model?:   string         - default "gpt-image-1"
 *
 * Response: image/png binary on success, JSON `{ error: string }` otherwise.
 *
 * Security model:
 *   - The real OpenAI key never leaves this Worker (stored as a secret).
 *   - Requests must come from an allowed Origin (CORS preflight + check).
 *   - Requests must carry the shared `UNLOCK_PASSWORD` (constant-time compare).
 *   - 401 on missing/wrong password lets the frontend re-prompt cleanly.
 */

interface Env {
  OPENAI_API_KEY: string;
  UNLOCK_PASSWORD: string;
  ALLOWED_ORIGINS: string;
}

const OPENAI_EDITS_URL = "https://api.openai.com/v1/images/edits";

function originAllowed(origin: string | null, env: Env): string | null {
  if (!origin) return null;
  const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

function corsHeaders(origin: string | null): HeadersInit {
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

function jsonError(message: string, status: number, origin: string | null): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

/** Constant-time string compare so the password check doesn't leak via timing. */
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.byteLength !== bb.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < ab.byteLength; i++) diff |= ab[i]! ^ bb[i]!;
  return diff === 0;
}

function checkPassword(req: Request, env: Env): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  return safeEqual(m[1]!.trim(), env.UNLOCK_PASSWORD);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const allowedOrigin = originAllowed(origin, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(allowedOrigin) });
    }

    if (origin && !allowedOrigin) {
      return jsonError("Origin not allowed.", 403, null);
    }

    if (request.method !== "POST") {
      return jsonError("Method not allowed.", 405, allowedOrigin);
    }

    if (!env.OPENAI_API_KEY || !env.UNLOCK_PASSWORD) {
      return jsonError(
        "Worker missing OPENAI_API_KEY or UNLOCK_PASSWORD secret.",
        500,
        allowedOrigin,
      );
    }

    if (!checkPassword(request, env)) {
      return jsonError("Invalid or missing password.", 401, allowedOrigin);
    }

    let inForm: FormData;
    try {
      inForm = await request.formData();
    } catch {
      return jsonError("Expected multipart/form-data body.", 400, allowedOrigin);
    }

    const image = inForm.get("image");
    if (!(image instanceof File)) {
      return jsonError("Missing `image` file in form body.", 400, allowedOrigin);
    }
    const prompt = (inForm.get("prompt") as string | null) ?? "";
    if (!prompt) {
      return jsonError("Missing `prompt` field in form body.", 400, allowedOrigin);
    }
    const size = (inForm.get("size") as string | null) ?? "1024x1024";
    const model = (inForm.get("model") as string | null) ?? "gpt-image-1";

    const upstream = new FormData();
    upstream.append("model", model);
    upstream.append("prompt", prompt);
    upstream.append("size", size);
    upstream.append("n", "1");
    upstream.append("image", image, image.name || "upload.png");

    const aiRes = await fetch(OPENAI_EDITS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: upstream,
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text().catch(() => "");
      let friendly = detail || aiRes.statusText;
      try {
        const parsed = JSON.parse(detail) as { error?: { message?: string } };
        if (parsed.error?.message) friendly = parsed.error.message;
      } catch {
        // raw text fallback
      }
      return jsonError(`OpenAI ${aiRes.status}: ${friendly}`, 502, allowedOrigin);
    }

    const json = (await aiRes.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    const item = json.data?.[0];
    if (!item) return jsonError("OpenAI response missing data.", 502, allowedOrigin);

    let bytes: ArrayBuffer;
    if (item.b64_json) {
      const bin = atob(item.b64_json);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      bytes = buf.buffer;
    } else if (item.url) {
      const r = await fetch(item.url);
      if (!r.ok) return jsonError(`Failed to download generated image (${r.status}).`, 502, allowedOrigin);
      bytes = await r.arrayBuffer();
    } else {
      return jsonError("OpenAI response missing image.", 502, allowedOrigin);
    }

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        ...corsHeaders(allowedOrigin),
      },
    });
  },
};
