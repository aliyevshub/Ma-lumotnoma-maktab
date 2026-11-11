// Javoblardagi imlo xatolarini tuzatish.
// A) Qoidalar — har bir javobda darhol, bepul.
// B) Sun'iy intellekt (Claude) — anketa oxirida barcha javoblarga bir marta,
//    faqat Cloudflare'da ANTHROPIC_API_KEY bo'lsa. Xato bo'lsa — A natijasi qoladi.
import Anthropic from "@anthropic-ai/sdk";

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
  mehribon: "mehribon", mexribon: "mehribon", tirishqoq: "tirishqoq", tirishqok: "tirishqoq",
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

// A) Qoidalar bilan tuzatish
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

const SYSTEM = `Siz o'zbek tili (lotin yozuvi) bo'yicha muharrirsiz. Maktab "Ma'lumotnoma" anketasidagi javoblarning faqat imlo va yozuv xatolarini tuzatasiz.

Qoidalar:
- Faqat aniq xatolarni tuzating: harf tushib qolgan yoki almashgan so'zlar, noto'g'ri tutuq belgisi (o', g'), bosh harf, tinish belgilari, ortiqcha bo'sh joy.
- Ma'noni, so'z tartibini va uslubni o'zgartirmang. Yangi ma'lumot qo'shmang, hech narsani olib tashlamang.
- Odam ismlari, familiyalari va otasining ismini o'zgartirmang — faqat bosh harf va o'/g' belgisini to'g'rilash mumkin.
- Joy, tashkilot va maktab nomlarini, raqamlarni o'zgartirmang (faqat aniq imlo xatosi bo'lsa).
- Oddiy lotin yozuvini ishlating: sh, ch, o', g' (Ş, Ç, Ö, Ğ emas).
- Rus yoki ingliz tilida yozilgan javobni tarjima qilmang, faqat imlosini to'g'rilang.
- Xato bo'lmasa, javobni aynan o'zicha qaytaring.

Har bir kalit uchun tuzatilgan javobni qaytaring.`;

// B) Sun'iy intellekt bilan tuzatish. answers: {key: value}; qaytaradi: tuzatilgan nusxa
export async function aiFix(env, answers) {
  if (!env.ANTHROPIC_API_KEY) return answers;
  const keys = Object.keys(answers).filter((k) => typeof answers[k] === "string" && answers[k] && k !== "tugilgan" && k !== "telefon");
  if (!keys.length) return answers;
  const input = Object.fromEntries(keys.map((k) => [k, answers[k]]));
  const schema = {
    type: "object",
    properties: Object.fromEntries(keys.map((k) => [k, { type: "string" }])),
    required: keys,
    additionalProperties: false,
  };
  try {
    const client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      ...(env.ANTHROPIC_BASE_URL ? { baseURL: env.ANTHROPIC_BASE_URL } : {}),
      timeout: 40_000,
      maxRetries: 1,
    });
    const response = await client.beta.messages.create({
      model: env.AI_MODEL || "claude-opus-5-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      output_config: { effort: "low", format: { type: "json_schema", schema } },
      messages: [{ role: "user", content: `Anketa javoblari (JSON):\n${JSON.stringify(input, null, 2)}` }],
    });
    if (response.stop_reason !== "end_turn") return answers;
    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const out = JSON.parse(text);
    const result = { ...answers };
    for (const k of keys) {
      const v = typeof out[k] === "string" ? out[k].trim() : "";
      // ehtiyot: bo'sh yoki keskin o'zgargan javob qabul qilinmaydi
      if (!v || v.length > answers[k].length * 1.5 + 10 || v.length < answers[k].length * 0.5) continue;
      result[k] = ruleFix(k, v);
    }
    return result;
  } catch (e) {
    if (e instanceof Anthropic.APIError) console.log(`AI tuzatish xatosi ${e.status}:`, e.message);
    else console.log("AI tuzatish xatosi:", e?.message || e);
    return answers;
  }
}
