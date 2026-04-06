/** Pastel circle fills behind avatars (shows through transparent PNGs). */
export const AVATAR_BG_PALETTE = [
  "#A4DFC0",
  "#FCBAC3",
  "#F8DB8B",
  "#91D9F4",
  "#D1BDEA",
  "#E7B38E",
] as const;

function seedBucket(seed: string, size: number): number {
  if (size <= 0) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % size;
}

/** Stable “random” palette color per seed (e.g. avatar `src` or username). */
export function avatarBgFromSeed(seed: string): string {
  return AVATAR_BG_PALETTE[seedBucket(seed, AVATAR_BG_PALETTE.length)]!;
}
