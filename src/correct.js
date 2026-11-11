// Javoblardagi imlo xatolarini qoidalar bilan tuzatish (bepul, har javobda darhol).
// Ish tartibi: matn oddiy lotinga keltiriladi → tuzatiladi → yangi alifbo tanlangan bo'lsa, o'giriladi.
import { toNew } from "./alphabet.js";

// Ism-familiya kabi har so'zi bosh harf bilan yoziladigan maydonlar
const NAME_KEYS = new Set(["familiya", "ism", "sharif", "otasi", "onasi"]);
// Ro'yxat ko'rinishidagi javoblar (vergul bilan ajratiladi)
const LIST_KEYS = new Set(["fanlar", "togaraklar", "bosh_vaqt", "orzular", "fel_atvor"]);

// Yangi alifbo harflari → oddiy lotin
const ALPHABET = { "Ş": "Sh", "ş": "sh", "Ç": "Ch", "ç": "ch", "Ö": "O'", "ö": "o'", "Ğ": "G'", "ğ": "g'" };

// Viloyat, shahar va tumanlar — doim bosh harf bilan
const PLACES = [
  "Toshkent", "Andijon", "Namangan", "Farg'ona", "Samarqand", "Buxoro", "Navoiy", "Qashqadaryo",
  "Surxondaryo", "Jizzax", "Sirdaryo", "Xorazm", "Qoraqalpog'iston", "Nukus", "Urganch", "Qarshi",
  "Termiz", "Guliston", "Qo'qon", "Marg'ilon", "Chirchiq", "Olmaliq", "Angren", "Bekobod", "Ohangaron",
  "Yangiyo'l", "Shahrisabz", "Kitob", "Kattaqo'rg'on", "Denov", "Asaka", "Xonobod", "Shahrixon",
  "Chust", "Kosonsoy", "Pop", "Chortoq", "Uchqo'rg'on", "Rishton", "Quva", "Oltiariq", "Beshariq",
  "Zarafshon", "Uchquduq", "G'ijduvon", "Kogon", "Xiva", "Beruniy", "To'rtko'l", "Qo'ng'irot",
  "Jarqo'rg'on", "Sherobod", "Boysun", "G'uzor", "Koson", "Yangiyer", "Shirin", "Zomin", "G'allaorol",
  "Urgut", "Bulung'ur", "Ishtixon", "Paxtakor", "Baliqchi", "Bo'z", "Izboskan", "Jalaquduq", "Qo'rg'ontepa",
  "Marhamat", "Paxtaobod", "Shahrixon", "Ulug'nor", "Xo'jaobod", "Bo'ston", "Yunusobod", "Chilonzor",
  "Mirzo Ulug'bek", "Yakkasaroy", "Sergeli", "Olmazor", "Shayxontohur", "Uchtepa", "Yashnobod", "Mirobod",
];
const PLACE_MAP = Object.fromEntries(PLACES.map((p) => [p.toLowerCase(), p]));
// Kitob — shahar nomi ham, oddiy so'z ham; uni faqat "shahri/tumani" oldidan bosh harf qilamiz
delete PLACE_MAP.kitob;
delete PLACE_MAP.pop;
delete PLACE_MAP.shirin;

// Tez-tez uchraydigan xatolar (kichik harfda, butun so'z) → to'g'ri yozilishi
const WORDS = {
  // millat
  ozbek: "o'zbek", uzbek: "o'zbek", "o'zbeg": "o'zbek", ozbeg: "o'zbek", uzbeg: "o'zbek",
  rus: "rus", qozoq: "qozoq", kozok: "qozoq", tojik: "tojik", tajik: "tojik", qoraqalpoq: "qoraqalpoq",
  turkman: "turkman", qirgiz: "qirg'iz", "qirg'iz": "qirg'iz", tatar: "tatar", koreys: "koreys",
  // sharoit, baho
  yaxshi: "yaxshi", yahshi: "yaxshi", yaxwi: "yaxshi", yahwi: "yaxshi", yaxsh: "yaxshi",
  orta: "o'rta", ortacha: "o'rtacha", urtacha: "o'rtacha", "o'rtacha": "o'rtacha", qoniqarli: "qoniqarli",
  alo: "a'lo", "a'lo": "a'lo", zor: "zo'r",
  // ish, kasb
  oqituvchi: "o'qituvchi", uqituvchi: "o'qituvchi", "o'qtuvchi": "o'qituvchi", oqtuvchi: "o'qituvchi",
  tarbiyachi: "tarbiyachi", tarbyachi: "tarbiyachi", tadbirkor: "tadbirkor", tatbirkor: "tadbirkor",
  biznesmen: "biznesmen", biznismen: "biznesmen", shifokor: "shifokor", shipokor: "shifokor", vrach: "shifokor",
  hamshira: "hamshira", xamshira: "hamshira", haydovchi: "haydovchi", xaydovchi: "haydovchi", haydavchi: "haydovchi",
  muhandis: "muhandis", muxandis: "muhandis", injener: "muhandis", dasturchi: "dasturchi", programmist: "dasturchi",
  harbiy: "harbiy", xarbiy: "harbiy", sotuvchi: "sotuvchi", oshpaz: "oshpaz", quruvchi: "quruvchi",
  dehqon: "dehqon", dexqon: "dehqon", fermer: "fermer", ishsiz: "ishsiz", nafaqada: "nafaqada",
  hisobchi: "hisobchi", xisobchi: "hisobchi", buxgalter: "buxgalter", bugalter: "buxgalter",
  rahbar: "rahbar", raxbar: "rahbar", direktor: "direktor", mudir: "mudir", usta: "usta",
  bekasi: "bekasi", bekesi: "bekasi", xodim: "xodim", hodim: "xodim", xodimi: "xodimi", hodimi: "xodimi",
  // fanlar
  matematika: "matematika", matematka: "matematika", matimatika: "matematika", matemetika: "matematika",
  adabiyot: "adabiyot", adabiyod: "adabiyot", tarix: "tarix", tarih: "tarix", biologiya: "biologiya",
  bialogiya: "biologiya", geografiya: "geografiya", giografiya: "geografiya", fizika: "fizika",
  kimyo: "kimyo", ximiya: "kimyo", informatika: "informatika", imformatika: "informatika",
  musiqa: "musiqa", muzika: "musiqa", musiqi: "musiqa", ingliz: "ingliz", englis: "ingliz", inglis: "ingliz",
  tabiiy: "tabiiy", tabiy: "tabiiy", texnologiya: "texnologiya", jismoniy: "jismoniy", tarbiya: "tarbiya",
  // to'garak, mashg'ulot
  shaxmat: "shaxmat", shahmat: "shaxmat", shashka: "shashka", futbol: "futbol", fudbol: "futbol",
  dzyudo: "dzyudo", dzudo: "dzyudo", judo: "dzyudo", kurash: "kurash", suzish: "suzish", suzsh: "suzish",
  raqs: "raqs", raks: "raqs", karate: "karate", boks: "boks", tennis: "tennis", gimnastika: "gimnastika",
  robototexnika: "robototexnika", velosiped: "velosiped", velosipet: "velosiped", multfilm: "multfilm",
  // harakatlar
  oqish: "o'qish", uqish: "o'qish", bolish: "bo'lish", bulish: "bo'lish", "bo'lsh": "bo'lish",
  chizish: "chizish", chizsh: "chizish", oynash: "o'ynash", uynash: "o'ynash", qilish: "qilish",
  korish: "ko'rish", kurish: "ko'rish", tinglash: "tinglash", yozish: "yozish",
  // fe'l-atvor
  mehribon: "mehribon", mexribon: "mehribon", mehrbon: "mehribon", mexrbon: "mehribon",
  tirishqoq: "tirishqoq", tirishqok: "tirishqoq", odobli: "odobli", adobli: "odobli",
  xushmuomala: "xushmuomala", hushmuomala: "xushmuomala", intizomli: "intizomli", quvnoq: "quvnoq",
  kuvnoq: "quvnoq", shox: "sho'x", "sho'x": "sho'x", kamgap: "kamgap", aqlli: "aqlli", aqilli: "aqlli",
  mehnatkash: "mehnatkash", mexnatkash: "mehnatkash", tinch: "tinch", ilmli: "ilmli",
  // manzil
  mfy: "MFY", kocha: "ko'cha", kucha: "ko'cha", kochasi: "ko'chasi", kuchasi: "ko'chasi",
  mahalla: "mahalla", mahala: "mahalla", maxalla: "mahalla", shaxar: "shahar", shaxri: "shahri",
  shahar: "shahar", shahri: "shahri", tuman: "tuman", tumani: "tumani", viloyat: "viloyat", viloyati: "viloyati",
  mavze: "mavze", mavzesi: "mavzesi", "yo'q": "yo'q", yoq: "yo'q", yuq: "yo'q", bor: "bor",
};

const toPlain = (s) => { for (const [k, v] of Object.entries(ALPHABET)) s = s.split(k).join(v); return s; };
// o`, o‘, oʻ, o’, o´ → o' (g ham shunday); boshqa joylardagi ` ham '
const fixApostrophes = (s) => s.replace(/[`‘’ʻʼ´]/g, "'");

function keepCase(orig, repl) {
  if (/^\p{Lu}/u.test(repl)) return repl; // joy nomlari, MFY — doim bosh harf bilan
  return /^\p{Lu}/u.test(orig) ? repl.charAt(0).toUpperCase() + repl.slice(1) : repl;
}

// "o'g'li" / "qizi" va ularning xato yozilishlari — doim kichik harf bilan
const PATRONYMIC = /^(o'g'li|o'gli|og'li|ogli|ugli|u'g'li|o'g'il|qizi|kizi|qiz)$/i;
function titleWord(w) {
  if (!w) return w;
  if (PATRONYMIC.test(w)) return /^(qizi|kizi|qiz)$/i.test(w) ? "qizi" : "o'g'li";
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

function fixWords(s) {
  return s.replace(/[\p{L}']+/gu, (w) => {
    const lower = w.toLowerCase();
    if (PLACE_MAP[lower]) return PLACE_MAP[lower];
    const r = WORDS[lower];
    return r ? keepCase(w, r) : w;
  });
}

// Juft so'zlar: "ota ona" → "ota-ona", "aka uka" → "aka-uka"
function fixPairs(s) {
  return s
    .replace(/\b(ota)\s+(ona\p{L}*)/giu, "$1-$2")
    .replace(/\b(aka)\s+(uka\p{L}*)/giu, "$1-$2")
    .replace(/\b(opa)\s+(singil\p{L}*)/giu, "$1-$2")
    .replace(/\b(aka)\s+(opa\p{L}*)/giu, "$1-$2");
}

// Raqamli manzil va tartib: "16 uy" → "16-uy", "1 tor" → "1-tor", "12 maktab" → "12-maktab"
const NUM_WORDS = "uy|tor|kv|kvartira|xonadon|maktab|sinf|dmtt|bog'cha|mavze|daha|berk|bino|uyi";
function fixNumbers(s) {
  return s
    .replace(new RegExp(`(\\d+)\\s*-?\\s*(${NUM_WORDS})\\b`, "giu"), (m, n, w) => `${n}-${w.toLowerCase() === "dmtt" ? "DMTT" : w}`)
    // "Maorif ko'cha 16-uy" → "Maorif ko'chasi 16-uy"
    .replace(/\bko'cha(\s+\d)/giu, "ko'chasi$1");
  }

// Manzil: shahar, tuman, MFY, ko'cha, tor nomlaridan keyin vergul
function addressCommas(s) {
  // joy nomi + shahar/tuman/viloyat → bosh harf (Kitob shahri kabi)
  s = s.replace(/\b(\p{L}[\p{L}']*)(\s+(?:shahar|shahri|tumani|viloyati|tuman|viloyat))\b/gu,
    (m, a, b) => a.charAt(0).toUpperCase() + a.slice(1) + b);
  s = s.replace(/\b(shahar|shahri|tumani|viloyati|MFY|mahallasi|ko'chasi|mavzesi|massivi|\d+-tor|\d+-mavze|\d+-kv)(?=\s+[\p{L}\d])/giu, "$1,");
  // har bir qism (ko'cha, MFY, tor nomi) bosh harf bilan
  return s.split(/,\s*/).map(capFirst).join(", ");
}

const capFirst = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

// Fanlar ro'yxati: ma'lum fan nomlari orasiga vergul
const SUBJECTS = ["ona tili", "ingliz tili", "rus tili", "nemis tili", "chet tili", "jismoniy tarbiya",
  "tasviriy san'at", "tabiiy fan", "matematika", "adabiyot", "o'qish", "tarix", "biologiya", "fizika",
  "kimyo", "geografiya", "informatika", "musiqa", "texnologiya", "rasm", "algebra", "geometriya",
  "shaxmat", "futbol", "dzyudo", "kurash", "suzish", "raqs", "karate", "boks", "tennis", "gimnastika",
  "robototexnika", "mental arifmetika", "arifmetika", "ingliz", "voleybol", "basketbol", "taekvondo", "sambo",
  // fe'l-atvor
  "mehribon", "odobli", "xushmuomala", "tirishqoq", "intizomli", "quvnoq", "sho'x", "kamgap", "aqlli",
  "mehnatkash", "tinch", "xushfe'l", "ziyrak", "faol", "jiddiy", "sabrli", "rostgo'y", "kamtar", "do'stona",
  "mas'uliyatli", "chaqqon", "dadil", "uyatchan", "hazilkash", "yaxshi", "a'lo"];
function splitKnownList(s) {
  const parts = s.split(/\s*,\s*|\s+va\s+/i);
  const out = [];
  for (let part of parts) {
    let rest = part.trim();
    const found = [];
    while (rest) {
      const low = rest.toLowerCase();
      const hit = SUBJECTS.find((x) => low === x || low.startsWith(x + " "));
      if (!hit) return null; // ro'yxat emas — tegmaymiz
      found.push(rest.slice(0, hit.length));
      rest = rest.slice(hit.length).trim();
    }
    out.push(...found);
  }
  return out.length > 1 ? out.join(", ") : null;
}

// "-ish" bilan tugaydigan harakatlar orasiga vergul: "kitob o'qish rasm chizish" → "kitob o'qish, rasm chizish"
const NO_COMMA_AFTER = /^(uchun|bilan|va|ham|kerak|mumkin|yoqadi|yaxshi|juda)$/i;
function actionCommas(s) {
  const words = s.split(" ");
  for (let i = 0; i < words.length - 1; i++) {
    const w = words[i];
    if (/[,.;:]$/.test(w)) continue;
    if (/\p{L}{2,}(ish|ash|sh)$/iu.test(w) && w.length > 4 && !NO_COMMA_AFTER.test(words[i + 1])) words[i] = w + ",";
  }
  return words.join(" ");
}

function tidy(s) {
  return s.replace(/\s+/g, " ").trim()
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,;:])(?=[^\s\d])/g, "$1 ")
    .replace(/([,.;:!?])\1+/g, "$1")
    .replace(/,\s*$/, "");
}

export function ruleFix(key, value, alphabet) {
  let s = tidy(fixApostrophes(toPlain(String(value ?? ""))));
  if (NAME_KEYS.has(key)) {
    s = s.split(" ").map((w) => w.split("-").map(titleWord).join("-")).join(" ");
  } else {
    s = fixWords(fixNumbers(fixPairs(s)));
    if (key === "manzil") s = addressCommas(s);
    if (LIST_KEYS.has(key)) s = splitKnownList(s) || actionCommas(s);
    s = capFirst(tidy(s)); // hujjat uslubi: javob bosh harf bilan boshlanadi
  }
  // yangi alifbo tanlanganda: sh→ş, ch→ç, o'→ö, g'→ğ
  return alphabet === "new" ? toNew(s) : s;
}
