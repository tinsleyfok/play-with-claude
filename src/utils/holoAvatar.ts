const COLORS = [
  "#E8845C", "#D4637B", "#E57B6C", "#5BAD8A",
  "#2D3655", "#C9854F", "#7B6DB5", "#4A9EBF",
  "#D4A04E", "#8B6F5E", "#6BA37E", "#BF6B8A",
];

const FACES = [
  // happy smile
  `<circle cx="11" cy="13" r="1.5" fill="#fff"/><circle cx="21" cy="13" r="1.5" fill="#fff"/><path d="M10 19q6 5 12 0" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  // closed happy eyes
  `<path d="M9 13q2-2 4 0" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M19 13q2-2 4 0" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M10 19q6 5 12 0" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  // wink
  `<circle cx="11" cy="13" r="1.5" fill="#fff"/><path d="M19 13q2-2 4 0" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M12 19q4 3 8 0" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  // surprised
  `<circle cx="11" cy="13" r="1.5" fill="#fff"/><circle cx="21" cy="13" r="1.5" fill="#fff"/><circle cx="16" cy="20" r="2" stroke="#fff" stroke-width="1.5" fill="none"/>`,
  // content
  `<path d="M9 13q2-2 4 0" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M19 13q2-2 4 0" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M13 19h6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>`,
  // cheerful
  `<circle cx="11" cy="13" r="1.5" fill="#fff"/><circle cx="21" cy="13" r="1.5" fill="#fff"/><path d="M11 19q5 4 10 0" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  // sleepy
  `<path d="M9 14h4" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><path d="M19 14h4" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><path d="M13 20q3 2 6 0" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  // big grin
  `<path d="M9 12q2-3 4 0" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M19 12q2-3 4 0" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M9 18q7 7 14 0" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  // cool dots
  `<circle cx="11" cy="14" r="1.2" fill="#fff"/><circle cx="21" cy="14" r="1.2" fill="#fff"/><circle cx="16" cy="20" r="1.2" fill="#fff"/>`,
  // smirk
  `<circle cx="11" cy="13" r="1.5" fill="#fff"/><circle cx="21" cy="13" r="1.5" fill="#fff"/><path d="M13 19q5 3 8 0" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  // shy blush
  `<circle cx="11" cy="13" r="1.5" fill="#fff"/><circle cx="21" cy="13" r="1.5" fill="#fff"/><path d="M13 19h6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="17" r="2" fill="rgba(255,255,255,0.2)"/><circle cx="24" cy="17" r="2" fill="rgba(255,255,255,0.2)"/>`,
  // cat mouth
  `<circle cx="11" cy="13" r="1.5" fill="#fff"/><circle cx="21" cy="13" r="1.5" fill="#fff"/><path d="M12 19l4 2l4-2" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
];

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function holoAvatar(username: string, size = 56): string {
  const h = hashSeed(username);

  const bucket = h % 20;

  if (bucket < 13) {
    const gender = h % 2 === 0 ? "female" : "male";
    const id = (h % 70) + 1;
    return `https://xsgames.co/randomusers/assets/avatars/${gender}/${id}.jpg`;
  }

  if (bucket < 17) {
    return `https://robohash.org/${username}.png?set=set4&size=200x200`;
  }

  const bg = COLORS[h % COLORS.length];
  const face = FACES[h % FACES.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="16" fill="${bg}"/>
    ${face}
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
