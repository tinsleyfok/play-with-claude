import { useState, type CSSProperties } from "react";
import { avatarBgFromSeed } from "../utils/avatarBgPalette";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  /** Pick background from palette; defaults to hashing `src`. Pass username when `src` is shared. */
  bgSeed?: string;
  /** When set, uses this circle fill instead of the palette from `bgSeed`. */
  circleFill?: string;
  /** Set false to skip palette fill (rare). */
  paletteBg?: boolean;
};

/** Avatar `<img>` with a pastel background from `AVATAR_BG_PALETTE` + gradient fallback if load fails. */
export function AvatarImg({ src, alt = "", className = "", style, bgSeed, circleFill, paletteBg = true }: Props) {
  const [failed, setFailed] = useState(false);
  const fill = !paletteBg ? undefined : circleFill ?? avatarBgFromSeed(bgSeed ?? src);

  if (failed) {
    return (
      <span
        className={`inline-block rounded-full object-cover ${className} ${fill ? "" : "bg-gradient-to-br from-amber-400 to-rose-500"}`}
        style={{ ...style, ...(fill ? { backgroundColor: fill } : {}) }}
        aria-hidden
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ ...style, ...(fill ? { backgroundColor: fill } : {}) }}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
