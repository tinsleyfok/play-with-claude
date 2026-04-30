import { publicUrl } from "./publicAsset";

/**
 * Default profile pictures — line-art PNGs in `public/Profiles/`.
 * Expected: `1.png`, `1-1.png` … `1-11.png`.
 */
export const DEFAULT_PROFILE_PICTURES = [
  publicUrl("Profiles/1.png"),
  publicUrl("Profiles/1-1.png"),
  publicUrl("Profiles/1-2.png"),
  publicUrl("Profiles/1-3.png"),
  publicUrl("Profiles/1-4.png"),
  publicUrl("Profiles/1-5.png"),
  publicUrl("Profiles/1-6.png"),
  publicUrl("Profiles/1-7.png"),
  publicUrl("Profiles/1-8.png"),
  publicUrl("Profiles/1-9.png"),
  publicUrl("Profiles/1-10.png"),
  publicUrl("Profiles/1-11.png"),
] as const;

/**
 * Display metadata for the default avatar gallery (modal on `/app/system/avatar`).
 * Order matches `DEFAULT_PROFILE_PICTURES`. Colors come from `AVATAR_BG_PALETTE`.
 */
export const DEFAULT_AVATAR_PROFILES: ReadonlyArray<{ src: string; name: string; color: string }> = [
  { src: DEFAULT_PROFILE_PICTURES[0]!,  name: "Julia",    color: "#D1BDEA" },
  { src: DEFAULT_PROFILE_PICTURES[1]!,  name: "Annie",    color: "#FCBAC3" },
  { src: DEFAULT_PROFILE_PICTURES[2]!,  name: "Charles",  color: "#A4DFC0" },
  { src: DEFAULT_PROFILE_PICTURES[3]!,  name: "Ariel",    color: "#D1BDEA" },
  { src: DEFAULT_PROFILE_PICTURES[4]!,  name: "Jiachen",  color: "#91D9F4" },
  { src: DEFAULT_PROFILE_PICTURES[5]!,  name: "Jiaxuan",  color: "#FCBAC3" },
  { src: DEFAULT_PROFILE_PICTURES[6]!,  name: "Tianyu",   color: "#91D9F4" },
  { src: DEFAULT_PROFILE_PICTURES[7]!,  name: "Chunwei",  color: "#E7B38E" },
  { src: DEFAULT_PROFILE_PICTURES[8]!,  name: "Chipeng",  color: "#91D9F4" },
  { src: DEFAULT_PROFILE_PICTURES[9]!,  name: "Ayush",    color: "#A4DFC0" },
  { src: DEFAULT_PROFILE_PICTURES[10]!, name: "Quang",    color: "#D1BDEA" },
  { src: DEFAULT_PROFILE_PICTURES[11]!, name: "Tinsley",  color: "#F8DB8B" },
];

/** pravatar.cc ships a fixed set of portrait photos; `img` picks one deterministically. */
const PRAVATAR_IMG_COUNT = 70;

function seedBucket(seed: string, size: number): number {
  if (size <= 0) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % size;
}

/**
 * Online stock-photo portrait (photographic, not illustration). Same face per `username`.
 * @see https://pravatar.cc
 */
export function onlinePhotoPortraitAvatar(username: string, size = 128): string {
  const img = seedBucket(username, PRAVATAR_IMG_COUNT) + 1;
  const s = Math.min(Math.max(size, 40), 1000);
  return `https://i.pravatar.cc/${s}?img=${img}`;
}

/** @deprecated Use `onlinePhotoPortraitAvatar` — was DiceBear; now aliases to photo URLs. */
export function aiGeneratedPersonAvatar(username: string, size = 128): string {
  return onlinePhotoPortraitAvatar(username, size);
}

/**
 * ~50% default line-art (`DEFAULT_PROFILE_PICTURES`), ~50% online photo portrait (pravatar.cc).
 * Split by card id digit (odd → photo, even → default) so 12/12 per full feed column.
 */
export function feedProfileAvatar(cardId: string, username: string): string {
  const m = cardId.match(/\d+/);
  const n = m ? parseInt(m[0], 10) : 0;
  const useOnlinePhoto = n % 2 === 1;
  if (useOnlinePhoto) {
    return onlinePhotoPortraitAvatar(username);
  }
  return DEFAULT_PROFILE_PICTURES[seedBucket(username, DEFAULT_PROFILE_PICTURES.length)]!;
}
