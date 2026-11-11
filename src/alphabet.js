// Oddiy lotin → yangi alifbo (ö, ğ, ş, ç). Anketa savollari va PDF yorliqlari uchun.
const PAIRS = [["Sh", "Ş"], ["SH", "Ş"], ["sh", "ş"], ["Ch", "Ç"], ["CH", "Ç"], ["ch", "ç"],
  ["O'", "Ö"], ["o'", "ö"], ["G'", "Ğ"], ["g'", "ğ"]];

export function toNew(s) {
  let out = String(s);
  for (const [a, b] of PAIRS) out = out.split(a).join(b);
  return out;
}

// alphabet: 'new' bo'lsa o'giradi, aks holda o'zgarishsiz
export function inAlphabet(s, alphabet) {
  return alphabet === "new" ? toNew(s) : s;
}

// Yangi alifbo → oddiy (eski) lotin: ş→sh, ç→ch, ö→o', ğ→g'
const BACK = [["Ş", "Sh"], ["ş", "sh"], ["Ç", "Ch"], ["ç", "ch"], ["Ö", "O'"], ["ö", "o'"], ["Ğ", "G'"], ["ğ", "g'"]];
export function toOld(s) {
  let out = String(s);
  for (const [a, b] of BACK) out = out.split(a).join(b);
  return out;
}
