// Anketa savollari — qog'ozdagi Ma'lumotnoma tartibida.
// label  — PDF'dagi va xulosadagi nom
// prompt — botda so'raladigan matn (bo'lmasa label işlatiladi)
// type   — text | date | phone | photo
export const QUESTIONS = [
  { key: "familiya", label: "Familiyasi", type: "text" },
  { key: "ism", label: "Ismi", type: "text" },
  { key: "sharif", label: "Şarifi", type: "text" },
  { key: "tugilgan", label: "Tuğilgan kun, oy, yil", type: "date",
    prompt: "Tuğilgan kun, oy, yil\n(masalan: 15.03.2018)" },
  { key: "millati", label: "Millati", type: "text" },
  { key: "otasi", label: "Otasi", type: "text", prompt: "Otasi (F.I.Ş.)" },
  { key: "ota_ish", label: "Iş joyi, lavozimi", type: "text",
    prompt: "Otasining iş joyi, lavozimi" },
  { key: "onasi", label: "Onasi", type: "text", prompt: "Onasi (F.I.Ş.)" },
  { key: "ona_ish", label: "Iş joyi, lavozimi", type: "text",
    prompt: "Onasining iş joyi, lavozimi" },
  { key: "farzand_soni", label: "Oilada neçta farzand", type: "text" },
  { key: "nechanchi", label: "Oilada neçançi farzand", type: "text" },
  { key: "sharoit", label: "Oilaviy şaroiti", type: "text" },
  { key: "fanlar", label: "Qiziqqan fanlari", type: "text" },
  { key: "togaraklar", label: "Qanday tögaraklarga qatnaşadi", type: "text" },
  { key: "bosh_vaqt", label: "Böş vaqtida nimalar bilan şuğullanadi", type: "text", long: true },
  { key: "fel_atvor", label: "Fe'l atvor xususiyati", type: "text" },
  { key: "orzular", label: "Kelajakdagi orzulari", type: "text" },
  { key: "telefon", label: "Telefon raqami", type: "phone",
    prompt: "Telefon raqami\n(masalan: +998 90 123 45 67)" },
  { key: "manzil", label: "Yaşaş manzili (MFY, köça, uy raqami)", type: "text" },
  { key: "rasm", label: "Rasm 3x4", type: "photo",
    prompt: "Rasm 3x4 — suratni rasm (foto) qilib yuboring" },
];

export const MAX_LEN = 150;
export const MAX_LEN_LONG = 220;

export function questionIndex(key) {
  return QUESTIONS.findIndex((q) => q.key === key);
}

// Sana: KK.OO.YYYY (., /, - ajratgiçlari ham qabul qilinadi)
export function parseDate(text) {
  const m = String(text).trim().match(/^(\d{1,2})[.\/\- ](\d{1,2})[.\/\- ](\d{4})$/);
  if (!m) return null;
  const d = +m[1], mo = +m[2], y = +m[3];
  const now = new Date();
  if (y < 1990 || y > now.getUTCFullYear()) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  if (dt > now) return null;
  return `${String(d).padStart(2, "0")}.${String(mo).padStart(2, "0")}.${y}`;
}

// Telefon: O'zbekiston raqami → +998 XX XXX XX XX
export function parsePhone(text) {
  let digits = String(text).replace(/[^\d]/g, "");
  if (digits.length === 9) digits = "998" + digits;
  if (digits.length !== 12 || !digits.startsWith("998")) return null;
  const p = digits.slice(3);
  return `+998 ${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5, 7)} ${p.slice(7, 9)}`;
}
