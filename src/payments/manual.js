// Qo'lda to'lov: kartaga o'tkazish → chek rasmi → admin tasdiqlaydi.
// Keyinchalik payme.js / stars.js xuddi shu interfeys bilan qo'shiladi:
//   start(env, form)                 — to'lovni boshlash (foydalanuvchiga ko'rsatma)
//   onUserMessage(env, form, msg, hooks) — "payment" holatidagi xabar (chek yoki bepul kod)
//   onAdminCallback(env, cq, data, hooks) — admin tugmalari
//   onAdminText(env, msg, hooks)     — admin rad etish sababi
// To'lov tasdiqlanganda hooks.onPaid(formId) chaqiriladi.
import { tg, send, inlineKeyboard, downloadFile } from "../telegram.js";
import { checkReceipt } from "../receipt.js";
import { saveForm, formById, displayName } from "../db.js";
import { T } from "../texts.js";

export const name = "manual";

export function adminIds(env) {
  return String(env.ADMIN_ID || "").split(",").map((s) => s.trim()).filter(Boolean);
}

const html = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function start(env, form) {
  const card = env.CARD_NUMBER || "—";
  const text = T.payInfo(price(env), html(card), html(env.CARD_OWNER || "—"));
  const r = await send(env, form.chat_id, text, {
    parse_mode: "HTML",
    ...inlineKeyboard([[{ text: T.btnCopyCard, copy_text: { text: card.replace(/\s+/g, "") } }]]),
  });
  // ehtiyot uchun: tugma qabul qilinmasa — tugmasiz yuboramiz
  if (!r.ok) await send(env, form.chat_id, text, { parse_mode: "HTML" });
}

function price(env) {
  return Number(env.PRICE || 5000).toLocaleString("ru-RU").replace(/ /g, " ");
}

function receiptFrom(msg) {
  if (msg.photo?.length) return { kind: "photo", fileId: msg.photo[msg.photo.length - 1].file_id };
  if (msg.document) {
    const m = msg.document.mime_type || "";
    if (m.startsWith("image/")) return { kind: "document", fileId: msg.document.file_id, image: true };
    if (m === "application/pdf") return { kind: "document", fileId: msg.document.file_id };
  }
  return null;
}

// Bepul to'lov kodi (admin /yangikod bilan o'rnatadi; ishlatish soni cheklanmaydi)
export async function currentCode(env) {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'promo_code'").first();
  return row?.value || null;
}

export async function onUserMessage(env, form, msg, hooks) {
  const text = (msg.text || "").trim();
  if (text) {
    const code = await currentCode(env);
    if (code && text.toLowerCase() === code.toLowerCase()) {
      await env.DB.prepare(
        "INSERT INTO payments (form_id, chat_id, amount, provider, external_id, status, decided_at) VALUES (?, ?, 0, 'code', ?, 'approved', datetime('now'))",
      ).bind(form.id, form.chat_id, code).run();
      await send(env, form.chat_id, T.codeAccepted);
      for (const a of adminIds(env)) await send(env, a, T.adminCodeUsed(displayName(form), form.id));
      return hooks?.onPaid?.(form.id, { quiet: true });
    }
    return send(env, form.chat_id, code ? T.codeWrong : T.needReceipt);
  }

  const r = receiptFrom(msg);
  if (!r) return send(env, form.chat_id, T.needReceipt);

  // rasm — sun'iy intellekt chekka o'xshashini tekshiradi (PDF chek tekshirilmaydi)
  let ai = { verdict: "unknown" };
  if (r.kind === "photo" || r.image) {
    const bytes = await downloadFile(env, r.fileId);
    ai = await checkReceipt(env, bytes);
    if (ai.verdict === "not_receipt") return send(env, form.chat_id, T.notReceipt);
  }

  const p = await env.DB.prepare(
    "INSERT INTO payments (form_id, chat_id, amount, provider, receipt_file_id) VALUES (?, ?, ?, 'manual', ?) RETURNING *",
  ).bind(form.id, form.chat_id, Number(env.PRICE || 5000), r.fileId).first();
  await saveForm(env, form, { status: "pending" });
  await send(env, form.chat_id, T.receiptReceived);

  const u = msg.from || {};
  const who = [u.first_name, u.last_name].filter(Boolean).join(" ") +
    (u.username ? ` (@${u.username})` : "") + ` [${form.chat_id}]`;
  const caption = T.adminReceipt({ ...p, amount: price(env) }, { id: form.id, name: displayName(form) }, who) +
    (ai.verdict === "receipt" ? `\n${T.aiReceiptNote(ai)}` : "");
  const kb = inlineKeyboard([
    [{ text: T.btnApprove, callback_data: `ap:${p.id}` }, { text: T.btnReject, callback_data: `rj:${p.id}` }],
    [{ text: T.btnWrite, callback_data: `w:${form.id}` }],
  ]);
  for (const admin of adminIds(env)) {
    const method = r.kind === "photo" ? "sendPhoto" : "sendDocument";
    await tg(env, method, { chat_id: admin, [r.kind]: r.fileId, caption, ...kb });
  }
}

// Qarordan keyin chek ostidagi tugmalarni almashtirish va izoh yozish
async function finishAdminMessage(env, chatId, messageId, note, rows = []) {
  if (!messageId) return send(env, chatId, note, rows.length ? inlineKeyboard(rows) : {});
  await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: rows } });
  await send(env, chatId, note, { reply_to_message_id: messageId });
}

const writeRow = (formId) => [{ text: T.btnWrite, callback_data: `w:${formId}` }];

export async function onAdminCallback(env, cq, data, hooks) {
  const adminChat = cq.message.chat.id;
  const [action, idStr] = data.split(":");
  const id = Number(idStr);
  const by = cq.from.username ? `@${cq.from.username}` : cq.from.first_name || "admin";

  if (action === "ap") {
    const p0 = await env.DB.prepare("SELECT * FROM payments WHERE id = ?").bind(id).first();
    const f0 = p0 && (await formById(env, p0.form_id));
    if (f0?.paid) return tg(env, "answerCallbackQuery", { callback_query_id: cq.id, text: T.adminAlreadyPaid });
    // xato rad etilgan chekni ham tasdiqlash mumkin
    const res = await env.DB.prepare(
      "UPDATE payments SET status = 'approved', decided_at = datetime('now') WHERE id = ? AND status IN ('pending', 'rejected')",
    ).bind(id).run();
    if (!res.meta.changes) return tg(env, "answerCallbackQuery", { callback_query_id: cq.id, text: T.adminAlready });
    await tg(env, "answerCallbackQuery", { callback_query_id: cq.id });
    const p = await env.DB.prepare("SELECT * FROM payments WHERE id = ?").bind(id).first();
    await finishAdminMessage(env, adminChat, cq.message.message_id, T.adminApproved(id, by), [writeRow(p.form_id)]);
    await hooks.onPaid(p.form_id);
    return;
  }

  if (action === "rj") {
    const p = await env.DB.prepare("SELECT * FROM payments WHERE id = ?").bind(id).first();
    if (!p || p.status !== "pending") {
      return tg(env, "answerCallbackQuery", { callback_query_id: cq.id, text: T.adminAlready });
    }
    await env.DB.prepare(
      "INSERT OR REPLACE INTO admin_state (admin_id, payment_id, message_id, mode, form_id) VALUES (?, ?, ?, 'reject', ?)",
    ).bind(cq.from.id, id, cq.message.message_id, p.form_id).run();
    await tg(env, "answerCallbackQuery", { callback_query_id: cq.id });
    await send(env, adminChat, T.adminAskReason(id), { reply_markup: { force_reply: true } });
  }
}

// Admin rad etish sababini yozayotgan bo'lsa — true qaytaradi
export async function onAdminText(env, msg) {
  const st = await env.DB.prepare("SELECT * FROM admin_state WHERE admin_id = ?").bind(msg.from.id).first();
  if (!st || st.mode !== "reject") return false;
  const text = (msg.text || "").trim();
  if (text === "/bekor") {
    await env.DB.prepare("DELETE FROM admin_state WHERE admin_id = ?").bind(msg.from.id).run();
    await send(env, msg.chat.id, T.adminCancelReason);
    return true;
  }
  if (!text || text.startsWith("/")) return false;

  await env.DB.prepare("DELETE FROM admin_state WHERE admin_id = ?").bind(msg.from.id).run();
  const reason = text.slice(0, 300);
  const res = await env.DB.prepare(
    "UPDATE payments SET status = 'rejected', reason = ?, decided_at = datetime('now') WHERE id = ? AND status = 'pending'",
  ).bind(reason, st.payment_id).run();
  if (!res.meta.changes) {
    await send(env, msg.chat.id, T.adminAlready);
    return true;
  }
  const p = await env.DB.prepare("SELECT * FROM payments WHERE id = ?").bind(st.payment_id).first();
  const form = await formById(env, p.form_id);
  if (form && form.status === "pending") await saveForm(env, form, { status: "payment" });
  await send(env, p.chat_id, T.rejected(reason));
  await finishAdminMessage(env, msg.chat.id, st.message_id, T.adminRejected(p.id, reason), [
    [{ text: T.btnApproveAnyway, callback_data: `ap:${p.id}` }],
    writeRow(p.form_id),
  ]);
  return true;
}
