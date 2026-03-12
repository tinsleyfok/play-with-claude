function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const STYLES = ["adventurer", "fun-emoji", "lorelei", "notionists"];

export function holoAvatar(username: string, _size = 56): string {
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

  const style = STYLES[h % STYLES.length];
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${username}&radius=50`;
}
