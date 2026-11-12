// To'lov chekini sun'iy intellekt (Cloudflare Workers AI) bilan tekshirish.
// Maqsad: chekdan boshqa rasmlarni (selfi, hujjat va h.k.) qabul qilmaslik.
// Pul haqiqatan kelganini admin o'zi tekshiradi.
// Natija: { verdict: "receipt" | "not_receipt" | "unknown", amount?, card? }
// "unknown" (AI ishlamasa yoki ishonchsiz bo'lsa) — chek adminga o'tkaziladi.

export const RECEIPT_MODEL = "@cf/meta/llama-3.2-11b-vision-instruct";

const PROMPT =
  "You are checking an image that a user sent as proof of a bank card payment. " +
  "Decide if the image is a payment receipt or a screenshot of a completed money transfer / payment " +
  "(for example from Payme, Click, Uzum, Paynet, Apelsin or a bank app), possibly in Uzbek or Russian. " +
  "Answer ONLY with JSON: " +
  '{"receipt": true or false, "amount": "amount shown or null", "card": "last 4 card digits shown or null"}. ' +
  "Photos of people, documents, forms, random pictures or unrelated screenshots are NOT receipts.";

function parse(text) {
  const m = String(text || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

function b64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

// Model kirish formatlari: birinchi ishlagani ishlatiladi
function inputs(bytes) {
  const dataUrl = `data:image/jpeg;base64,${b64(bytes)}`;
  return [
    { messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: dataUrl } }] }], max_tokens: 200 },
    { prompt: PROMPT, image: [...bytes], max_tokens: 200 },
    { messages: [{ role: "user", content: PROMPT }], image: [...bytes], max_tokens: 200 },
  ];
}

async function runModel(env, bytes) {
  let lastErr;
  for (const input of inputs(bytes)) {
    try {
      return await env.AI.run(RECEIPT_MODEL, input);
    } catch (e) {
      const msg = String(e?.message || e);
      // Llama 3.2 Vision birinchi marta litsenziyaga rozilik ("agree") talab qiladi
      if (/agree/i.test(msg)) {
        await env.AI.run(RECEIPT_MODEL, { prompt: "agree" });
        try { return await env.AI.run(RECEIPT_MODEL, input); } catch (e2) { lastErr = e2; continue; }
      }
      lastErr = e;
    }
  }
  throw lastErr;
}

export async function checkReceipt(env, bytes) {
  if (env.RECEIPT_AI === "off" || !bytes) return { verdict: "unknown" };
  try {
    let out;
    if (env.RECEIPT_AI_MOCK) {
      // lokal sinov uchun soxta server
      out = await (await fetch(env.RECEIPT_AI_MOCK, { method: "POST", body: bytes })).json();
    } else {
      if (!env.AI) return { verdict: "unknown" };
      const res = await runModel(env, bytes);
      const raw = res?.response ?? res?.description ?? res;
      out = parse(typeof raw === "string" ? raw : JSON.stringify(raw));
      if (!out) console.log("chek AI javobi o'qilmadi:", String(typeof raw === "string" ? raw : JSON.stringify(raw)).slice(0, 300));
    }
    if (out && typeof out.receipt === "string") out.receipt = /^(true|yes|ha)$/i.test(out.receipt.trim()) ? true : /^(false|no|yo'q)$/i.test(out.receipt.trim()) ? false : null;
    if (!out || typeof out.receipt !== "boolean") return { verdict: "unknown" };
    const clean = (v) => (v && String(v).toLowerCase() !== "null" ? String(v).slice(0, 40) : null);
    const amount = clean(out.amount), card = clean(out.card);
    // ehtiyot: summa yoki karta raqami o'qilgan bo'lsa — chekka o'xshaydi, rad etilmaydi
    const looksLike = out.receipt || Boolean(amount) || Boolean(card);
    return { verdict: looksLike ? "receipt" : "not_receipt", amount, card };
  } catch (e) {
    console.log("chek AI xatosi:", e?.message || e);
    return { verdict: "unknown" };
  }
}
