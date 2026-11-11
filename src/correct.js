// Javoblardagi oddiy imlo xatolarini qoidalar bilan tuzatish (bepul, har javobda darhol).

// Ism-familiya kabi har so'zi bosh harf bilan yoziladigan maydonlar
const NAME_KEYS = new Set(["familiya", "ism", "sharif", "otasi", "onasi"]);

// Yangi alifbo harflari → oddiy lotin
const ALPHABET = { "Ş": "Sh", "ş": "sh", "Ç": "Ch", "ç": "ch", "Ö": "O'", "ö": "o'", "Ğ": "G'", "ğ": "g'" };

// Tez-tez uchraydigan xatolar (kichik harfda, butun so'z)
const WORDS = {
  ozbek: "o'zbek", uzbek: "o'zbek", "o'zbeg": "o'zbek", ozbeg: "o'zbek",
  qozoq: "qozoq", tojik: "tojik", rus: "rus", qoraqalpoq: "qoraqalpoq", turkman: "turkman",
  yaxshi: "yaxshi", yahshi: "yaxshi", yaxwi: "yaxshi", yahwi: "yaxshi",
  orta: "o'rta", "o'rtacha": "o'rtacha", ortacha: "o'rtacha", qoniqarli: "qoniqarli",
  oqituvchi: "o'qituvchi", uqituvchi: "o'qituvchi", "o'qtuvchi": "o'qituvchi",
  shifokor: "shifokor", vrach: "shifokor", hamshira: "hamshira",
  matematika: "matematika", matematka: "matematika",
  ingliz: "ingliz", englis: "ingliz", rasm: "rasm", jismoniy: "jismoniy",
  shaxmat: "shaxmat", shahmat: "shaxmat", futbol: "futbol", fudbol: "futbol",
  mfy: "MFY", kocha: "ko'cha", "kuchasi": "ko'chasi", kochasi: "ko'chasi", mahalla: "mahalla", mahala: "mahalla",
  toshkent: "Toshkent", tashkent: "Toshkent", samarqand: "Samarqand", buxoro: "Buxoro",
  mehribon: "mehribon", mexribon: "mehribon", mehrbon: "mehribon", mexrbon: "mehribon", tirishqoq: "tirishqoq", tirishqok: "tirishqoq",
  "yo'q": "yo'q", yoq: "yo'q", "yuq": "yo'q", bor: "bor",
};

function fixApostrophes(s) {
  // o`, o‘, oʻ, o’, o´ → o' (g ham shunday); boshqa joylardagi ` ham '
  return s.replace(/[`‘’ʻʼ´]/g, "'");
}

function titleWord(w) {
  if (!w) return w;
  // "g'ayratovich" → "G'ayratovich"; "o'g'li" kabi qo'shimchalar kichik qoladi
  if (/^(o'g'li|qizi|ugli|kizi)$/i.test(w)) return w.toLowerCase().replace(/^ugli$/, "o'g'li").replace(/^kizi$/, "qizi");
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

function fixWords(s) {
  // bosh harf holati saqlanadi
  return s.replace(/[\p{L}']+/gu, (w) => {
    const r = WORDS[w.toLowerCase()];
    return r ? keepCase(w, r) : w;
  });
}

function keepCase(orig, repl) {
  if (/^\p{Lu}/u.test(repl)) return repl; // joy nomlari doim bosh harf bilan
  return /^\p{Lu}/u.test(orig) ? repl.charAt(0).toUpperCase() + repl.slice(1) : repl;
}

export function ruleFix(key, value) {
  let s = String(value ?? "");
  for (const [k, v] of Object.entries(ALPHABET)) s = s.split(k).join(v);
  s = fixApostrophes(s);
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/\s+([,.;:!?])/g, "$1").replace(/([,;:])(?=\S)/g, "$1 ");
  s = s.replace(/([,.;:!?])\1+/g, "$1");
  if (NAME_KEYS.has(key)) {
    s = s.split(" ").map((w) => w.split("-").map(titleWord).join("-")).join(" ");
  } else {
    s = fixWords(s);
  }
  return s;
}
