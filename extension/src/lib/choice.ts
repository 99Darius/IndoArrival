/** DOM-free helpers shared by content scripts and the background worker. */

/** Choice options are labelled in the site's current language; match either. */
const CHOICE_SYNONYMS: string[][] = [
  ["male", "laki-laki"],
  ["female", "perempuan"],
  ["yes", "ya"],
  ["no", "tidak"],
];

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function sameChoice(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  return x === y || CHOICE_SYNONYMS.some((g) => g.includes(x) && g.includes(y));
}

