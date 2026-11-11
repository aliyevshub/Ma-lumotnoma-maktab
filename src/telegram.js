// Telegram Bot API uchun yengil klient.
// TG_API_BASE — lokal sinovda soxta Telegram serveriga yo'naltirish uchun.
function base(env) {
  return (env.TG_API_BASE || "https://api.telegram.org").replace(/\/$/, "");
}

export async function tg(env, method, payload = {}) {
  const res = await fetch(`${base(env)}/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({ ok: false }));
  if (!data.ok) console.log(`tg ${method} failed:`, JSON.stringify(data).slice(0, 300));
  return data;
}

export function send(env, chatId, text, extra = {}) {
  return tg(env, "sendMessage", { chat_id: chatId, text, ...extra });
}

export function inlineKeyboard(rows) {
  return { reply_markup: { inline_keyboard: rows } };
}

// PDF (Uint8Array) ni hujjat sifatida yuborish; Telegram file_id qaytaradi
export async function sendPdf(env, chatId, bytes, filename, caption) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  if (caption) form.append("caption", caption);
  form.append("document", new Blob([bytes], { type: "application/pdf" }), filename);
  const res = await fetch(`${base(env)}/bot${env.BOT_TOKEN}/sendDocument`, {
    method: "POST",
    body: form,
  });
  const data = await res.json().catch(() => ({ ok: false }));
  if (!data.ok) {
    console.log("sendDocument failed:", JSON.stringify(data).slice(0, 300));
    return null;
  }
  return data.result?.document?.file_id || null;
}

export async function sendFile(env, chatId, bytes, filename, mime, caption) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  if (caption) form.append("caption", caption);
  form.append("document", new Blob([bytes], { type: mime }), filename);
  const res = await fetch(`${base(env)}/bot${env.BOT_TOKEN}/sendDocument`, {
    method: "POST",
    body: form,
  });
  return res.json().catch(() => ({ ok: false }));
}

// Telegram'dagi faylni yuklab olish (rasm uchun)
export async function downloadFile(env, fileId) {
  const info = await tg(env, "getFile", { file_id: fileId });
  if (!info.ok) return null;
  const res = await fetch(`${base(env)}/file/bot${env.BOT_TOKEN}/${info.result.file_path}`);
  if (!res.ok) return null;
  return new Uint8Array(await res.arrayBuffer());
}
