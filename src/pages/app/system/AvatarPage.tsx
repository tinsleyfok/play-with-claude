import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTheme } from "../../../hooks/useTheme";
import { AvatarImg } from "../../../components/AvatarImg";
import { DEFAULT_AVATAR_PROFILES, DEFAULT_PROFILE_PICTURES } from "../../../utils/profileAvatars";
import { AVATAR_BG_SWATCHES } from "../../../utils/avatarBgPalette";
import {
  AVATAR_AI_AVAILABLE,
  AVATAR_AI_REQUIRES_PASSWORD,
  AvatarAuthError,
  generateStylizedAvatar,
} from "../../../utils/avatarGenerate";

const PASSWORD_STORAGE_KEY = "avatar-proxy-password";

function readStoredPassword(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(PASSWORD_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeStoredPassword(value: string): void {
  if (typeof window === "undefined") return;
  try {
    if (value) window.sessionStorage.setItem(PASSWORD_STORAGE_KEY, value);
    else window.sessionStorage.removeItem(PASSWORD_STORAGE_KEY);
  } catch {
    // ignore storage failures (private mode, etc.)
  }
}

/**
 * Selected = ember outline + ember text; unselected = neutral outline. Both hollow.
 * `isDark` is passed in because this app uses `data-site-theme` (not Tailwind's
 * `dark:` variant) — relying on `dark:` would silently no-op.
 */
function emberButtonClass(active: boolean, isDark: boolean): string {
  const base =
    "w-full rounded-lg border bg-transparent px-3 py-2 text-center text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6030]/45";
  const ring = isDark ? "focus-visible:ring-offset-black" : "focus-visible:ring-offset-[#F0EBE7]";
  if (active) {
    const tone = isDark
      ? "border-[#FF7548] text-[#FF7548] hover:bg-[#FF6030]/[0.16]"
      : "border-[#FF6030] text-[#FF6030] hover:bg-[#FF6030]/[0.08]";
    return `${base} ${ring} ${tone}`;
  }
  const tone = isDark
    ? "border-white/25 text-white/85 hover:bg-white/[0.08]"
    : "border-black/15 text-black/80 hover:bg-black/[0.04]";
  return `${base} ${ring} ${tone}`;
}

/** Solid ember fill — used for the primary CTA (Generate). */
function emberFilledButtonClass(isDark: boolean): string {
  const ring = isDark ? "focus-visible:ring-offset-black" : "focus-visible:ring-offset-[#F0EBE7]";
  return `w-full rounded-lg border border-[#FF6030] bg-[#FF6030] px-3 py-2 text-center text-[13px] font-semibold text-white shadow-[0_8px_22px_rgba(255,96,48,0.32)] transition-colors hover:bg-[#FF7548] hover:border-[#FF7548] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6030]/45 ${ring}`;
}

/** `/app/system/avatar` — full-bleed area (no phone chrome); single centered avatar. */
export function AvatarPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#000000" : "#F0EBE7";
  const muted = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
  const [circleFill, setCircleFill] = useState<string>(AVATAR_BG_SWATCHES[0]!);
  /** Three discrete steps: 0 = Simple, 50 = Medium, 100 = Complex. */
  const [complexity, setComplexity] = useState<0 | 50 | 100>(50);
  /** Index into `DEFAULT_PROFILE_PICTURES` — the base shown when there is no AI/upload result. */
  const [selectedDefaultIdx, setSelectedDefaultIdx] = useState(0);
  /** When set, replaces the default base avatar with the AI-generated (or uploaded fallback) image URL. */
  const [generatedSrc, setGeneratedSrc] = useState<string | null>(null);
  /** Raw camera roll / fallback upload — skip multiply so colors stay natural. */
  const [uploadIsRawPhoto, setUploadIsRawPhoto] = useState(false);
  /** File the user picked (kept around so Generate can re-run with the latest complexity). */
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  /** Local blob URL just for the 1:1 preview thumbnail under the Upload button. */
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Modal showing the 12 default avatars to pick from. */
  const [defaultPickerOpen, setDefaultPickerOpen] = useState(false);
  /**
   * Cached proxy password. Lives in sessionStorage so refresh keeps it,
   * closing the tab clears it, and 401 from the proxy invalidates it.
   * Empty string means "locked / not yet entered".
   */
  const [proxyPassword, setProxyPassword] = useState<string>(() =>
    AVATAR_AI_REQUIRES_PASSWORD ? readStoredPassword() : "",
  );
  const [passwordDraft, setPasswordDraft] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  /** Controls the password modal — opened only when Generate is clicked while locked. */
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const aiUnlocked = !AVATAR_AI_REQUIRES_PASSWORD || proxyPassword.length > 0;
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (generatedSrc) URL.revokeObjectURL(generatedSrc);
      if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl);
      abortRef.current?.abort();
    };
  }, [generatedSrc, uploadedPreviewUrl]);

  const defaultBaseAvatarSrc = DEFAULT_PROFILE_PICTURES[selectedDefaultIdx] ?? DEFAULT_PROFILE_PICTURES[0]!;
  const baseAvatarSrc = generatedSrc ?? defaultBaseAvatarSrc;
  const usingUpload = generatedSrc != null;
  /** White paper / AI white canvas → blend out; real photos stay unblended. */
  const knockOutPaperWhite = !usingUpload || !uploadIsRawPhoto;

  const handleSelectDefault = (idx: number) => {
    abortRef.current?.abort();
    if (generatedSrc) URL.revokeObjectURL(generatedSrc);
    setGeneratedSrc(null);
    setUploadIsRawPhoto(false);
    setError(null);
    setSelectedDefaultIdx(idx);
    setDefaultPickerOpen(false);
  };

  useEffect(() => {
    if (!defaultPickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDefaultPickerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [defaultPickerOpen]);

  const handleUploadClick = () => {
    if (generating) return;
    fileInputRef.current?.click();
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    abortRef.current?.abort();
    if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl);
    if (generatedSrc) URL.revokeObjectURL(generatedSrc);
    setGeneratedSrc(null);
    setUploadIsRawPhoto(false);
    setError(null);
    setUploadedFile(file);
    setUploadedPreviewUrl(URL.createObjectURL(file));
  };
  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setPasswordDraft("");
    setPasswordError(null);
  };

  /**
   * Actual stylization call. Pulled out of `handleGenerate` so the password
   * modal can run it directly with the freshly-typed password without waiting
   * for `proxyPassword` state to settle.
   */
  const runGenerate = async (passwordOverride?: string) => {
    if (!uploadedFile || generating) return;
    const password = passwordOverride ?? proxyPassword;
    if (AVATAR_AI_REQUIRES_PASSWORD && !password) {
      setPasswordModalOpen(true);
      return;
    }

    abortRef.current?.abort();
    setError(null);
    setGenerating(true);

    const previousSrc = generatedSrc;
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await generateStylizedAvatar(
        uploadedFile,
        controller.signal,
        complexity,
        AVATAR_AI_REQUIRES_PASSWORD ? password : undefined,
      );
      if (previousSrc) URL.revokeObjectURL(previousSrc);
      setUploadIsRawPhoto(result.fallback);
      setGeneratedSrc(result.url);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("[AvatarPage] generation failed:", err);
      if (err instanceof AvatarAuthError) {
        writeStoredPassword("");
        setProxyPassword("");
        setPasswordError(err.message || "Wrong password — try again.");
        setPasswordModalOpen(true);
        return;
      }
      const msg = (err as Error).message || "Unknown error";
      setError(msg.length > 220 ? msg.slice(0, 220) + "…" : msg);
      if (previousSrc) URL.revokeObjectURL(previousSrc);
      setUploadIsRawPhoto(true);
      setGeneratedSrc(URL.createObjectURL(uploadedFile));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (!uploadedFile || generating) return;
    if (AVATAR_AI_REQUIRES_PASSWORD && !proxyPassword) {
      setPasswordError(null);
      setPasswordDraft("");
      setPasswordModalOpen(true);
      return;
    }
    void runGenerate();
  };

  const handleUnlockSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = passwordDraft.trim();
    if (!trimmed) {
      setPasswordError("Password is required.");
      return;
    }
    writeStoredPassword(trimmed);
    setProxyPassword(trimmed);
    setPasswordModalOpen(false);
    setPasswordDraft("");
    setPasswordError(null);
    void runGenerate(trimmed);
  };

  useEffect(() => {
    if (!passwordModalOpen) return;
    passwordInputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePasswordModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [passwordModalOpen]);

  return (
    <div
      className="flex min-h-0 flex-1 flex-row font-rethink"
      style={{ background: bg }}
    >
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center px-3 py-6 sm:px-6">
        <div
          className={`relative size-[min(16.5rem,45vmin)] shrink-0 overflow-hidden rounded-full ${
            isDark ? "shadow-[0_18px_50px_rgba(0,0,0,0.5)]" : "shadow-[0_16px_45px_rgba(0,0,0,0.14)]"
          }`}
          style={{ backgroundColor: circleFill }}
        >
          <AvatarImg
            src={baseAvatarSrc}
            alt=""
            bgSeed="system-avatar-preview"
            paletteBg={false}
            className={`size-full rounded-full object-cover ${knockOutPaperWhite ? "mix-blend-multiply" : ""}`}
          />
          {generating && (
            <div
              className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
              style={{ background: isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.55)" }}
              role="status"
              aria-live="polite"
            >
              <div className="flex flex-col items-center gap-2">
                <span
                  className="size-8 animate-spin rounded-full border-2 border-transparent"
                  style={{ borderTopColor: "#FF6030", borderRightColor: "#FF6030" }}
                  aria-hidden
                />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: muted }}>
                  Generating…
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      <aside
        className="relative flex min-w-[13.5rem] shrink-0 flex-col items-stretch border-l sm:min-w-[17rem]"
        style={{
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        }}
        aria-label="Avatar customization"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
        />

        <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-5 py-6 sm:gap-8 sm:px-8 sm:pb-4">
        <section>
          <p
            className="m-0 mb-3 w-full text-left text-[11px] font-semibold uppercase tracking-[0.12em] sm:mb-3.5"
            style={{ color: muted }}
          >
            Choose Color
          </p>
          <div className="grid w-full grid-cols-3 gap-2.5" role="radiogroup" aria-label="Background color">
            {AVATAR_BG_SWATCHES.map((hex) => {
              const selected = circleFill === hex;
              return (
                <button
                  key={hex}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  title={hex}
                  onClick={() => setCircleFill(hex)}
                  className={`aspect-square shrink-0 rounded-full border-2 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    isDark ? "focus-visible:ring-white/40 focus-visible:ring-offset-black" : "focus-visible:ring-black/25 focus-visible:ring-offset-[#F0EBE7]"
                  } ${selected ? `scale-105 ${isDark ? "border-white/45" : "border-black/35"}` : "border-transparent hover:scale-105"}`}
                  style={{ backgroundColor: hex }}
                />
              );
            })}
          </div>
        </section>

        <section>
          <p
            className="m-0 mb-3 w-full text-left text-[11px] font-semibold uppercase tracking-[0.12em] sm:mb-3.5"
            style={{ color: muted }}
          >
            Choose complexity
          </p>
          <input
            type="range"
            min={0}
            max={100}
            step={50}
            value={complexity}
            onChange={(e) => {
              const v = Number(e.target.value);
              setComplexity(v === 0 ? 0 : v === 50 ? 50 : 100);
            }}
            aria-label="Avatar complexity: simple, medium, or complex"
            list="complexity-ticks"
            className={`complexity-range w-full cursor-pointer ${
              isDark ? "complexity-range--dark" : "complexity-range--light"
            }`}
            style={{ "--complexity": `${complexity}%` } as CSSProperties}
          />
          <datalist id="complexity-ticks">
            <option value="0" />
            <option value="50" />
            <option value="100" />
          </datalist>
          <div
            className="-mt-1 flex w-full items-center justify-between gap-1 text-[10px] font-medium leading-none"
            style={{ color: muted }}
          >
            <span className={complexity === 0 ? "text-[#FF6030]" : ""}>Simple</span>
            <span className={complexity === 50 ? "text-[#FF6030]" : ""}>Medium</span>
            <span className={complexity === 100 ? "text-[#FF6030]" : ""}>Complex</span>
          </div>
        </section>

        {AVATAR_AI_AVAILABLE && (
          <section>
            <div className="mb-3 flex w-full items-center gap-1.5 sm:mb-3.5">
              <p
                className="m-0 text-left text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: muted }}
              >
                Upload Image
              </p>
              {AVATAR_AI_REQUIRES_PASSWORD && !aiUnlocked && (
                <svg
                  viewBox="0 0 24 24"
                  className="size-3 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: muted }}
                  role="img"
                  aria-label="Locked — password required to generate"
                >
                  <rect x="4.5" y="11" width="15" height="9.5" rx="2" />
                  <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
                </svg>
              )}
            </div>
            <div className="flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={generating}
                className={`${emberButtonClass(false, isDark)} ${generating ? "cursor-progress opacity-60" : ""}`}
              >
                {uploadedFile ? "Replace Image" : "Upload Image"}
              </button>
              {uploadedPreviewUrl && (
                <div
                  className="relative size-20 self-start overflow-hidden rounded-lg border"
                  style={{
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  }}
                >
                  <img
                    src={uploadedPreviewUrl}
                    alt="Uploaded preview"
                    className="size-full object-cover"
                  />
                </div>
              )}
              {error && (
                <p
                  role="alert"
                  className="m-0 mt-1 w-full max-w-full whitespace-pre-wrap break-words text-[10px] leading-snug [overflow-wrap:anywhere]"
                  style={{ color: "#FF6030" }}
                >
                  {error}
                </p>
              )}
            </div>
          </section>
        )}
        </div>

        <div
          className="sticky bottom-0 z-10 flex flex-col gap-2 border-t px-5 py-4 sm:px-8"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            background: bg,
          }}
        >
          {AVATAR_AI_AVAILABLE && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!uploadedFile || generating}
              className={`${emberFilledButtonClass(isDark)} ${
                !uploadedFile ? "cursor-not-allowed opacity-50 shadow-none" : generating ? "cursor-progress opacity-80" : ""
              }`}
            >
              {generating ? "Generating…" : "Generate"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDefaultPickerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={defaultPickerOpen}
            className={emberButtonClass(false, isDark)}
          >
            Browse Default Avatars
          </button>
        </div>
      </aside>

      {defaultPickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose a default avatar"
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          onClick={() => setDefaultPickerOpen(false)}
        >
          <div
            className="absolute inset-0"
            style={{ background: isDark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.35)" }}
            aria-hidden
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[88vh] w-full max-w-[min(92vw,42rem)] flex-col rounded-2xl shadow-2xl"
            style={{
              background: isDark ? "#111111" : "#FFFFFF",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
            }}
          >
            <div
              className="flex shrink-0 items-center justify-between border-b px-5 py-4 sm:px-6"
              style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
            >
              <p
                className="m-0 text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: muted }}
              >
                Current Avatar
              </p>
              <button
                type="button"
                onClick={() => setDefaultPickerOpen(false)}
                aria-label="Close"
                className={`rounded-md px-2 py-1 text-[18px] leading-none transition-colors ${
                  isDark ? "hover:bg-white/10" : "hover:bg-black/5"
                }`}
                style={{ color: muted }}
              >
                ×
              </button>
            </div>
            <div
              className="grid min-h-0 flex-1 grid-cols-2 gap-x-4 gap-y-5 overflow-y-auto px-5 py-5 sm:grid-cols-3 sm:px-6 md:grid-cols-4"
              role="radiogroup"
              aria-label="Default avatars"
            >
              {DEFAULT_AVATAR_PROFILES.map(({ src, name, color }, idx) => {
                const selected = !usingUpload && idx === selectedDefaultIdx;
                return (
                  <button
                    key={src}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={name}
                    onClick={() => handleSelectDefault(idx)}
                    className="group flex flex-col items-center gap-2 rounded-xl p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6030]/45"
                  >
                    <span
                      className={`relative aspect-square w-full overflow-hidden rounded-full border-2 transition-transform group-hover:scale-[1.04] ${
                        selected ? "scale-[1.04] border-[#FF6030]" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      <img
                        src={src}
                        alt=""
                        className="size-full object-cover mix-blend-multiply"
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                    <span
                      className={`block w-full truncate text-center text-[12px] font-medium ${
                        selected ? "text-[#FF6030]" : ""
                      }`}
                      style={selected ? undefined : { color: isDark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.62)" }}
                    >
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {passwordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Unlock AI"
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          onClick={closePasswordModal}
        >
          <div
            className="absolute inset-0"
            style={{ background: isDark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.35)" }}
            aria-hidden
          />
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleUnlockSubmit}
            className="relative flex w-full max-w-[min(92vw,22rem)] flex-col gap-4 rounded-2xl px-6 py-6 shadow-2xl"
            style={{
              background: isDark ? "#111111" : "#FFFFFF",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
            }}
          >
            <div className="flex flex-col gap-1">
              <p
                className="m-0 text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: muted }}
              >
                Unlock AI
              </p>
              <p
                className="m-0 text-[12px] leading-snug"
                style={{ color: isDark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.62)" }}
              >
                Enter the password to start generating. It stays in this tab only.
              </p>
            </div>
            <input
              ref={passwordInputRef}
              type="password"
              value={passwordDraft}
              onChange={(e) => {
                setPasswordDraft(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              autoComplete="current-password"
              placeholder="Password"
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-[13px] outline-none transition-colors focus-visible:border-[#FF6030] focus-visible:ring-2 focus-visible:ring-[#FF6030]/35"
              style={{
                borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)",
                color: isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.85)",
              }}
              aria-label="Avatar AI password"
              aria-invalid={passwordError ? true : undefined}
            />
            {passwordError && (
              <p
                role="alert"
                className="m-0 -mt-2 w-full whitespace-pre-wrap break-words text-[11px] leading-snug"
                style={{ color: "#FF6030" }}
              >
                {passwordError}
              </p>
            )}
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={closePasswordModal}
                className={emberButtonClass(false, isDark)}
              >
                Cancel
              </button>
              <button type="submit" className={emberFilledButtonClass(isDark)}>
                Unlock & Generate
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
