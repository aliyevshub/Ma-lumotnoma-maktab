// Anketa savollari — qog'ozdagi Ma'lumotnoma tartibida.
// label  — PDF'dagi va xulosadagi nom
// prompt — botda so'raladigan matn (bo'lmasa label ishlatiladi)
// type   — text | date | phone | photo
// check  — name (faqat harflar) | fio (kamida 2 so'z) | count | order (raqam); bo'lmasa — kamida 2 harf
export const QUESTIONS = [
  { key: "familiya", label: "Familiyasi", type: "text", check: "name" },
  { key: "ism", label: "Ismi", type: "text", check: "name" },
  { key: "sharif", label: "Sharifi", type: "text", check: "name" },
  { key: "tugilgan", label: "Tug'ilgan kun, oy, yil", type: "date",
    prompt: "Tug'ilgan kun, oy, yil\n(masalan: 15.03.2018)" },
  { key: "millati", label: "Millati", type: "text", check: "name" },
  { key: "otasi", label: "Otasi", type: "text", check: "fio", prompt: "Otasi (F.I.Sh.)" },
  { key: "ota_ish", label: "Ish joyi, lavozimi", type: "text",
    prompt: "Otasining ish joyi, lavozimi" },
  { key: "onasi", label: "Onasi", type: "text", check: "fio", prompt: "Onasi (F.I.Sh.)" },
  { key: "ona_ish", label: "Ish joyi, lavozimi", type: "text",
    prompt: "Onasining ish joyi, lavozimi" },
  { key: "farzand_soni", label: "Oilada nechta farzand", type: "text", check: "count" },
  { key: "nechanchi", label: "Oilada nechanchi farzand", type: "text", check: "order" },
  { key: "sharoit", label: "Oilaviy sharoiti", type: "text" },
  { key: "fanlar", label: "Qiziqqan fanlari", type: "text" },
  { key: "togaraklar", label: "Qanday to'garaklarga qatnashadi", type: "text" },
  { key: "bosh_vaqt", label: "Bo'sh vaqtida nimalar bilan shug'ullanadi", type: "text", long: true },
  { key: "fel_atvor", label: "Fe'l atvor xususiyati", type: "text" },
  { key: "orzular", label: "Kelajakdagi orzulari", type: "text" },
  { key: "telefon", label: "Telefon raqami", type: "phone",
    prompt: "Telefon raqami\n(masalan: +998 90 123 45 67)" },
  { key: "manzil", label: "Yashash manzili (MFY, ko'cha, uy raqami)", type: "text" },
  { key: "rasm", label: "Rasm 3x4", type: "photo",
    prompt: "Rasm 3x4 — suratni rasm (foto) qilib yuboring" },
];

export const MAX_LEN = 150;
export const MAX_LEN_LONG = 220;

export function questionIndex(key) {
  return QUESTIONS.findIndex((q) => q.key === key);
}

// Sana: KK.OO.YYYY (., /, - ajratgichlari ham qabul qilinadi)
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

const letters = (s) => (String(s).match(/\p{L}/gu) || []).length;

// "3", "3 ta", "3-chi" → 3 (1..20), aks holda null
export function parseCount(text) {
  const m = String(text).trim().match(/^(\d{1,2})\s*(-?\s*(ta|nchi|chi|inchi))?\.?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 20 ? n : null;
}

// Matnli javobni tekshirish. Qaytaradi: { value } yoki { error: "matn kaliti" }
export function checkAnswer(q, value, answers) {
  // kirill yozuvi qabul qilinmaydi — faqat lotin harflari
  if (/[\u0400-\u04FF]/.test(value)) return { error: "noCyrillic" };
  switch (q.check) {
    case "name":
      if (!/^[\p{L}' -]+$/u.test(value) || letters(value) < 2) return { error: "badName" };
      return { value };
    case "fio":
      if (!/^[\p{L}' .-]+$/u.test(value) || value.split(" ").filter((w) => letters(w) >= 2).length < 2) return { error: "badFio" };
      return { value };
    case "count": {
      const n = parseCount(value);
      if (n == null) return { error: "badCount" };
      const order = parseCount(answers.nechanchi);
      if (order != null && order > n) return { error: "badCountLess" };
      return { value: String(n) };
    }
    case "order": {
      const n = parseCount(value);
      if (n == null) return { error: "badCount" };
      const total = parseCount(answers.farzand_soni);
      if (total != null && n > total) return { error: "badOrder" };
      return { value: String(n) };
    }
    default:
      if (letters(value) < 2) return { error: "badText" };
      return { value };
  }
}
