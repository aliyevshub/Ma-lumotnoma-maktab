// Bot mantig'i: anketa, tekshirish, tahrirlash, PDF, admin buyruqlari
import { tg, send, sendPdf, sendFile, inlineKeyboard, downloadFile } from "./telegram.js";
import { QUESTIONS, MAX_LEN, MAX_LEN_LONG, questionIndex, parseDate, parsePhone, checkAnswer } from "./questions.js";
import {
  currentForm, formById, createForm, saveForm, deleteForm, paidForms, allPaidForms, displayName,
} from "./db.js";
import { provider, adminIds } from "./payments/index.js";
import { buildPdf } from "./pdf.js";
import { buildXlsx } from "./export.js";
import { ruleFix } from "./correct.js";
import { inAlphabet, toNew } from "./alphabet.js";
import { T } from "./texts.js";

export function createBot(env, fonts) {
  const isAdmin = (id) => adminIds(env).includes(String(id));
  // Muharrir: faqat anketalarni tekshiradi, tahrirlaydi va yuboradi (cheklar, statistika — yo'q)
  const editorIds = () => String(env.EDITOR_ID || "").split(",").map((s) => s.trim()).filter(Boolean);
  const isEditor = (id) => isAdmin(id) || editorIds().includes(String(id));
  const reviewers = () => [...new Set([...adminIds(env), ...editorIds()])];
  const priceText = () => Number(env.PRICE || 5000).toLocaleString("ru-RU").replace(/ /g, " ");

  // ---------- Savol berish va xulosa ----------
  // Savol matni foydalanuvchi tanlagan yozuvda
  const A = (form, text) => inAlphabet(text, form.alphabet);

  async function ask(form, idx) {
    const q = QUESTIONS[idx];
    const head = T.progress(idx + 1, QUESTIONS.length);
    await send(env, form.chat_id, `${head}\n\n${A(form, q.prompt || q.label)}`);
  }

  async function askAlphabet(form) {
    await send(env, form.chat_id, T.chooseAlphabet, inlineKeyboard([[
      { text: T.btnLatin, callback_data: "ab:latin" },
      { text: T.btnNewAlphabet, callback_data: "ab:new" },
    ]]));
  }

  function summary(form) {
    const lines = QUESTIONS.map((q, i) => {
      const v = q.type === "photo" ? (form.photo_file_id ? T.photoAttached : "—") : (form.answers[q.key] || "—");
      const label = q.type === "photo" ? q.label : (q.prompt ? q.prompt.split("\n")[0] : q.label);
      return `${i + 1}. ${A(form, label)}: ${v}`;
    });
    return `${T.reviewTitle}\n\n${lines.join("\n")}`;
  }

  // Xulosa, so'ng alohida ogohlantirish — tugmalar ogohlantirish ostida
  async function showReview(form) {
    await send(env, form.chat_id, summary(form));
    await send(env, form.chat_id, T.reviewWarning, inlineKeyboard([[
      { text: T.btnEdit, callback_data: "edit" },
      { text: T.btnConfirm, callback_data: "ok" },
    ]]));
  }

  function editKeyboard(form) {
    const rows = [];
    QUESTIONS.forEach((q, i) => {
      const label = A(form, (q.prompt ? q.prompt.split("\n")[0] : q.label).replace(/\s*\(.*\)$/, ""));
      const btn = { text: `${i + 1}. ${label}`.slice(0, 40), callback_data: `e:${q.key}` };
      if (i % 2 === 0) rows.push([btn]); else rows[rows.length - 1].push(btn);
    });
    rows.push([{ text: T.btnBack, callback_data: "back" }]);
    return inlineKeyboard(rows);
  }

  // ---------- PDF ----------
  async function makePdf(form) {
    const photo = form.photo_file_id ? await downloadFile(env, form.photo_file_id) : null;
    return buildPdf(fonts, form.answers, photo, form.alphabet);
  }

  function pdfName(form) {
    const n = displayName(form).replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_|_$/g, "");
    return `Malumotnoma_${n || form.id}.pdf`;
  }

  async function deliverPdf(form, intro) {
    try {
      const bytes = await makePdf(form);
      if (intro) await send(env, form.chat_id, intro);
      const fileId = await sendPdf(env, form.chat_id, bytes, pdfName(form), T.pdfCaption(displayName(form)));
      if (!fileId) throw new Error("sendDocument failed");
      await saveForm(env, form, { pdf_file_id: fileId });
      for (const a of reviewers()) {
        if (String(a) === String(form.chat_id)) continue;
        const row = [{ text: T.btnAdminEdit, callback_data: `ae:${form.id}` }];
        if (isAdmin(a)) row.push({ text: T.btnWrite, callback_data: `w:${form.id}` }); // yozish — faqat admin
        await tg(env, "sendDocument", {
          chat_id: a, document: fileId, caption: `${T.adminPdfCopy(displayName(form))} (#${form.id})`,
          ...inlineKeyboard([row]),
        });
      }
    } catch (e) {
      console.log("PDF xato:", e?.stack || e);
      await send(env, form.chat_id, T.pdfError);
      for (const a of adminIds(env)) await send(env, a, `⚠️ Anketa #${form.id} PDF xatosi: ${e?.message || e}`);
    }
  }

  // To'lov tasdiqlanganda (har qanday to'lov usulidan): PDF darhol emas —
  // avval admin tekshiradi ("checking"), 📤 bosilgandan keyin foydalanuvchiga ketadi
  async function onPaid(formId) {
    const form = await formById(env, formId);
    if (!form) return;
    await saveForm(env, form, { paid: 1, status: "checking", edit_key: null });
    if (!isAdmin(form.chat_id)) await send(env, form.chat_id, T.approvedChecking);
    await sendAdminReview(form);
  }

  // ---------- Admin tekshiruvi va tuzatish ----------
  // Adminga: javoblar ro'yxati + qoralama PDF + [✏️ Tahrirlash] [📤 Yuborish]
  async function sendAdminReview(form, adminChat) {
    const targets = adminChat ? [adminChat] : reviewers();
    const lines = summary(form).split("\n").slice(2).join("\n");
    // as — birinchi yuborish (tekshiruvdan keyin), ar — tuzatilgan hujjatni qayta yuborish
    const first = form.status === "checking";
    let bytes = null;
    try { bytes = await makePdf(form); } catch (e) { console.log("qoralama PDF xatosi:", e?.message); }
    for (const a of targets) {
      await send(env, a, `${T.adminReviewTitle(displayName(form), form.id)}\n\n${lines}`);
      const kb = [[
        { text: T.btnAdminEdit, callback_data: `ae:${form.id}` },
        first ? { text: T.btnDeliver, callback_data: `as:${form.id}` } : { text: T.btnRedeliver, callback_data: `ar:${form.id}` },
      ]];
      if (bytes) {
        await sendPdf(env, a, bytes, pdfName(form), T.adminDraftCaption(displayName(form), form.id), { inline_keyboard: kb });
      } else {
        await send(env, a, T.adminDraftCaption(displayName(form), form.id), inlineKeyboard(kb));
      }
    }
  }

  async function adminEditChoose(cq, formId) {
    const f = await formById(env, formId);
    if (!f || !f.paid) return tg(env, "answerCallbackQuery", { callback_query_id: cq.id, text: T.adminNotFound, show_alert: true });
    await tg(env, "answerCallbackQuery", { callback_query_id: cq.id });
    const rows = [];
    QUESTIONS.forEach((q, i) => {
      const label = (q.prompt ? q.prompt.split("\n")[0] : q.label).replace(/\s*\(.*\)$/, "");
      const btn = { text: `${i + 1}. ${label}`.slice(0, 40), callback_data: `af:${f.id}:${q.key}` };
      if (i % 2 === 0) rows.push([btn]); else rows[rows.length - 1].push(btn);
    });
    await send(env, cq.message.chat.id, T.adminEditChoose(displayName(f), f.id), inlineKeyboard(rows));
  }

  async function adminEditField(cq, formId, key) {
    const f = await formById(env, formId);
    const q = QUESTIONS[questionIndex(key)];
    if (!f || !f.paid || !q) return tg(env, "answerCallbackQuery", { callback_query_id: cq.id, text: T.adminNotFound, show_alert: true });
    // yangi tugma eski holatni almashtiradi (boshqa anketaga adashib yozilmasligi uchun)
    await env.DB.prepare(
      "INSERT OR REPLACE INTO admin_state (admin_id, payment_id, message_id, mode, form_id, draft) VALUES (?, 0, NULL, 'aedit', ?, ?)",
    ).bind(cq.from.id, f.id, key).run();
    await tg(env, "answerCallbackQuery", { callback_query_id: cq.id });
    const label = q.prompt ? q.prompt.split("\n")[0] : q.label;
    const text = q.type === "photo" ? T.adminEditAskPhoto(displayName(f), f.id)
      : T.adminEditAsk(displayName(f), f.id, label, f.answers[key] || "—", f.alphabet === "new");
    await send(env, cq.message.chat.id, text, { reply_markup: { force_reply: true } });
  }

  // Admin yangi qiymatni yozdi (yoki rasm yubordi) — true: shu yerda qayta ishlandi
  async function onAdminEditInput(msg) {
    const st = await adminState(msg.from.id);
    if (!st || st.mode !== "aedit") return false;
    const text = (msg.text || "").trim();
    if (text === "/bekor") {
      await clearAdminState(msg.from.id);
      await send(env, msg.chat.id, T.adminEditCancelled);
      return true;
    }
    if (text.startsWith("/")) return false;
    const f = await formById(env, st.form_id);
    const q = QUESTIONS[questionIndex(st.draft)];
    if (!f || !q) { await clearAdminState(msg.from.id); await send(env, msg.chat.id, T.adminNotFound); return true; }
    if (q.type === "photo") {
      const fileId = msg.photo?.length ? msg.photo[msg.photo.length - 1].file_id
        : (msg.document && /^image\/(jpeg|png)$/.test(msg.document.mime_type || "") ? msg.document.file_id : null);
      if (!fileId) { await send(env, msg.chat.id, T.adminEditNeedPhoto); return true; }
      await saveForm(env, f, { photo_file_id: fileId });
    } else {
      if (!text) { await send(env, msg.chat.id, T.writeNeedText); return true; }
      // admin yozganidek saqlanadi; anketa yangi alifboda bo'lsa — faqat harflar o'giriladi
      let value = text.replace(/\s+/g, " ").slice(0, 300);
      if (f.alphabet === "new") value = toNew(value.replace(/[`‘’ʻʼ´]/g, "'"));
      await saveForm(env, f, { answers: { ...f.answers, [q.key]: value } });
    }
    await clearAdminState(msg.from.id);
    await send(env, msg.chat.id, T.adminEditSaved);
    await sendAdminReview(f, msg.chat.id);
    return true;
  }

  // 📤 — tekshirilgan (yoki tuzatilgan) hujjatni foydalanuvchiga yuborish
  async function adminDeliver(cq, formId, resend) {
    const f = await formById(env, formId);
    if (!f || !f.paid) return tg(env, "answerCallbackQuery", { callback_query_id: cq.id, text: T.adminNotFound, show_alert: true });
    await tg(env, "answerCallbackQuery", { callback_query_id: cq.id });
    await tg(env, "editMessageReplyMarkup", { chat_id: cq.message.chat.id, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } });
    let first = false;
    if (!resend) {
      // birinchi yuborish — ikki marta bosilsa ham bir marta ketadi
      const r = await env.DB.prepare("UPDATE forms SET status = 'done', updated_at = datetime('now') WHERE id = ? AND status = 'checking'").bind(f.id).run();
      first = r.meta.changes > 0;
      f.status = "done";
      if (!first) return send(env, cq.message.chat.id, T.adminDelivered(displayName(f), f.id));
    } else if (f.status === "checking") {
      return send(env, cq.message.chat.id, T.adminNotFound);
    }
    await deliverPdf(f, first ? T.docReady : T.correctedPdf);
    if (first && !isAdmin(f.chat_id)) await send(env, f.chat_id, T.menuDone);
    await send(env, cq.message.chat.id, f.pdf_file_id ? T.adminDelivered(displayName(f), f.id) : T.adminDeliverFailed(f.id));
    // muharrir yuborgan bo'lsa — adminlar ham bilsin
    if (f.pdf_file_id && !isAdmin(cq.from.id)) {
      const by = cq.from.first_name || cq.from.username || "muharrir";
      for (const a of adminIds(env)) await send(env, a, `${T.adminDelivered(displayName(f), f.id)} — ${by} (muharrir)`);
    }
  }

  // Admin uchun to'lov yo'q — PDF darhol
  async function adminFree(form) {
    await env.DB.prepare(
      "INSERT INTO payments (form_id, chat_id, amount, provider, status, decided_at) VALUES (?, ?, 0, 'admin', 'approved', datetime('now'))",
    ).bind(form.id, form.chat_id).run();
    return onPaid(form.id);
  }

  // ---------- Javobni qabul qilish ----------
  async function acceptAnswer(form, q, msg) {
    if (q.type === "photo") {
      let fileId = null;
      if (msg.photo?.length) fileId = msg.photo[msg.photo.length - 1].file_id;
      else if (msg.document && /^image\/(jpeg|png)$/.test(msg.document.mime_type || "")) fileId = msg.document.file_id;
      if (!fileId) return send(env, form.chat_id, T.needPhoto);
      await saveForm(env, form, { photo_file_id: fileId });
    } else {
      const text = (msg.text || "").trim();
      if (!text) return send(env, form.chat_id, T.needText);
      const max = q.long ? MAX_LEN_LONG : MAX_LEN;
      if (text.length > max) return send(env, form.chat_id, T.tooLong(max));
      let value = text.replace(/\s+/g, " ");
      if (q.type === "date") {
        value = parseDate(text);
        if (!value) return send(env, form.chat_id, T.badDate);
      } else if (q.type === "phone") {
        value = parsePhone(text);
        if (!value) return send(env, form.chat_id, T.badPhone);
      } else {
        const r = checkAnswer(q, ruleFix(q.key, value, form.alphabet), form.answers);
        if (r.error) return send(env, form.chat_id, T[r.error]);
        value = r.value;
      }
      await saveForm(env, form, { answers: { ...form.answers, [q.key]: value } });
    }

    if (form.edit_key) {
      await saveForm(env, form, { edit_key: null });
      return showReview(form);
    }
    const next = form.step + 1;
    if (next >= QUESTIONS.length) {
      await saveForm(env, form, { step: next, status: "review" });
      return showReview(form);
    }
    await saveForm(env, form, { step: next });
    return ask(form, next);
  }

  // ---------- Buyruqlar ----------
  async function startNew(chatId, from) {
    const form = await createForm(env, chatId, from?.username);
    await send(env, chatId, T.welcome());
    await askAlphabet(form);
  }

  async function resume(form) {
    switch (form.status) {
      case "filling":
        if (!form.alphabet && form.step === 0) return askAlphabet(form);
        if (form.edit_key) return send(env, form.chat_id, T.editAsk(labelOf(form, form.edit_key)));
        await send(env, form.chat_id, T.resume);
        return ask(form, form.step);
      case "review":
        if (form.edit_key) return send(env, form.chat_id, T.editAsk(labelOf(form, form.edit_key)));
        return showReview(form);
      case "payment":
        if (isAdmin(form.chat_id)) return adminFree(form);
        return provider(env).start(env, form);
      case "pending": return send(env, form.chat_id, T.waitAdmin);
      case "checking": return send(env, form.chat_id, T.waitCheck);
      default: return send(env, form.chat_id, T.menuDone);
    }
  }

  function labelOf(form, key) {
    const q = QUESTIONS[questionIndex(key)];
    return q ? A(form, q.prompt || q.label) : key;
  }

  async function cmdMine(chatId) {
    const forms = await paidForms(env, chatId);
    if (!forms.length) return send(env, chatId, T.noPaid);
    for (const f of forms) {
      if (f.status === "checking") { await send(env, chatId, T.waitCheck); continue; }
      if (f.pdf_file_id) {
        const r = await tg(env, "sendDocument", { chat_id: chatId, document: f.pdf_file_id, caption: T.pdfCaption(displayName(f)) });
        if (r.ok) continue;
      }
      await deliverPdf(f);
    }
  }

  // ---------- Admin ----------
  async function adminCommand(msg, cmd, arg) {
    const chatId = msg.chat.id;
    if (cmd === "/stat") {
      const admins = reviewers().map(Number); // admin va muharrirlar hisobga olinmaydi
      const notAdmin = admins.length ? `chat_id NOT IN (${admins.map(() => "?").join(",")})` : "1=1";
      // kunlar Toshkent vaqti bo'yicha (UTC+5)
      const u = await env.DB.prepare(
        `SELECT COUNT(*) total,
           SUM(date(first_seen, '+5 hours') = date('now', '+5 hours')) today,
           SUM(first_seen >= datetime('now', '-7 days')) week
         FROM users WHERE ${notAdmin}`,
      ).bind(...admins).first();
      const { results } = await env.DB.prepare("SELECT status, paid, COUNT(*) n FROM forms GROUP BY status, paid").all();
      const s = { filling: 0, payment: 0, pending: 0, checking: 0, done: 0 };
      for (const r of results) {
        if (r.paid && r.status === "checking") s.checking += r.n;
        else if (r.paid) s.done += r.n;
        else if (r.status === "filling" || r.status === "review") s.filling += r.n;
        else if (s[r.status] != null) s[r.status] += r.n;
      }
      const sum = await env.DB.prepare("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status = 'approved'").first();
      s.sum = Number(sum.s).toLocaleString("ru-RU").replace(/\u00a0/g, " ");
      s.users = { total: u.total || 0, today: u.today || 0, week: u.week || 0 };
      await send(env, chatId, T.adminStats(s), { parse_mode: "HTML" });
      return true;
    }
    if (cmd === "/export") {
      const forms = await allPaidForms(env);
      if (!forms.length) { await send(env, chatId, T.adminNoData); return true; }
      const bytes = buildXlsx(forms);
      const date = new Date().toISOString().slice(0, 10);
      await sendFile(env, chatId, bytes, `Malumotnoma_${date}.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", `Jami: ${forms.length} ta anketa`);
      return true;
    }
    if (cmd === "/pdf") {
      const f = await formById(env, Number(arg));
      if (!f || !f.paid) { await send(env, chatId, T.adminNotFound); return true; }
      try {
        const bytes = await makePdf(f);
        await sendPdf(env, chatId, bytes, pdfName(f), `${displayName(f)} (#${f.id})`);
      } catch (e) {
        await send(env, chatId, `⚠️ ${e?.message || e}`);
      }
      return true;
    }
    if (cmd === "/admin") { await send(env, chatId, T.adminHelp); return true; }
    return false;
  }

  // ---------- Admin → foydalanuvchi xabari ----------
  // Xavfsizlik: yozish faqat aniq anketa tugmasidan boshlanadi, yuborishdan oldin
  // qabul qiluvchi ismi bilan tasdiq so'raladi; yangi tugma eski holatni almashtiradi.
  async function adminState(adminId) {
    return env.DB.prepare("SELECT * FROM admin_state WHERE admin_id = ?").bind(adminId).first();
  }
  async function clearAdminState(adminId) {
    await env.DB.prepare("DELETE FROM admin_state WHERE admin_id = ?").bind(adminId).run();
  }

  async function startWrite(cq, formId) {
    const f = await formById(env, formId);
    if (!f) return tg(env, "answerCallbackQuery", { callback_query_id: cq.id, text: T.adminNotFound });
    await env.DB.prepare(
      "INSERT OR REPLACE INTO admin_state (admin_id, payment_id, message_id, mode, form_id, draft) VALUES (?, 0, NULL, 'write', ?, NULL)",
    ).bind(cq.from.id, f.id).run();
    await tg(env, "answerCallbackQuery", { callback_query_id: cq.id });
    await send(env, cq.message.chat.id, T.writeAsk(displayName(f), f.id), { reply_markup: { force_reply: true } });
  }

  // true — xabar shu yerda qayta ishlandi
  async function onAdminWriteText(msg) {
    const st = await adminState(msg.from.id);
    if (!st || st.mode !== "write") return false;
    const text = (msg.text || "").trim();
    if (text === "/bekor") {
      await clearAdminState(msg.from.id);
      await send(env, msg.chat.id, T.writeCancelled);
      return true;
    }
    if (text.startsWith("/")) return false;
    if (!text) { await send(env, msg.chat.id, T.writeNeedText); return true; }
    const f = await formById(env, st.form_id);
    if (!f) { await clearAdminState(msg.from.id); await send(env, msg.chat.id, T.adminNotFound); return true; }
    const draft = text.slice(0, 3000);
    await env.DB.prepare("UPDATE admin_state SET draft = ? WHERE admin_id = ?").bind(draft, msg.from.id).run();
    await send(env, msg.chat.id, T.writeConfirm(displayName(f), f.id, draft), inlineKeyboard([[
      { text: T.btnSend, callback_data: `ws:${f.id}` },
      { text: T.btnCancel, callback_data: "wc" },
    ]]));
    return true;
  }

  async function confirmWrite(cq, formId) {
    const chatId = cq.message.chat.id;
    const st = await adminState(cq.from.id);
    const clearKb = () => tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } });
    // eski yoki boshqa anketaga tegishli tasdiq tugmasi ishlamaydi
    if (!st || st.mode !== "write" || st.form_id !== formId || !st.draft) {
      await clearKb();
      return tg(env, "answerCallbackQuery", { callback_query_id: cq.id, text: T.writeExpired, show_alert: true });
    }
    const f = await formById(env, formId);
    await clearAdminState(cq.from.id);
    await tg(env, "answerCallbackQuery", { callback_query_id: cq.id });
    await clearKb();
    const r = await send(env, f.chat_id, T.adminMessageToUser(f.id, st.draft));
    await send(env, chatId, r.ok ? T.writeSent(displayName(f), f.id) : T.writeFailed);
  }

  // Foydalanuvchi admin xabariga javob (reply) qilsa — adminga yetkaziladi
  async function forwardUserReply(msg) {
    const orig = msg.reply_to_message;
    const m = orig?.from?.is_bot && (orig.text || "").match(/^✉️ Administrator xabari \(anketa #(\d+)\)/);
    if (!m) return false;
    const f = await formById(env, Number(m[1]));
    if (!f || f.chat_id !== msg.chat.id) return false;
    const u = msg.from || {};
    const who = [u.first_name, u.last_name].filter(Boolean).join(" ") + (u.username ? ` (@${u.username})` : "");
    for (const a of adminIds(env)) {
      await send(env, a, T.userReplyToAdmin(displayName(f), f.id, who),
        inlineKeyboard([[{ text: T.btnWrite, callback_data: `w:${f.id}` }]]));
      await tg(env, "copyMessage", { chat_id: a, from_chat_id: msg.chat.id, message_id: msg.message_id });
    }
    await send(env, msg.chat.id, T.userReplySent);
    return true;
  }

  // ---------- Xabarlar ----------
  // Botga kirganlar hisobi (statistika uchun): faqat ID va sana
  async function touchUser(chatId) {
    await env.DB.prepare(
      "INSERT INTO users (chat_id) VALUES (?) ON CONFLICT(chat_id) DO UPDATE SET last_seen = datetime('now')",
    ).bind(chatId).run();
  }

  async function onMessage(msg) {
    if (msg.chat?.type !== "private") return;
    const chatId = msg.chat.id;
    await touchUser(chatId);
    const text = (msg.text || "").trim();
    const [rawCmd, ...rest] = text.startsWith("/") ? text.split(/\s+/) : [""];
    const cmd = rawCmd.split("@")[0].toLowerCase();

    if (isEditor(msg.from?.id)) {
      if (await onAdminEditInput(msg)) return;
      if (cmd === "/tahrir") {
        const arg = rest.join(" ").trim();
        const f = /^\d+$/.test(arg) ? await formById(env, Number(arg)) : null;
        if (!arg) return send(env, chatId, T.adminTahrirUsage);
        if (!f || !f.paid) return send(env, chatId, T.adminNotFound);
        return sendAdminReview(f, chatId);
      }
    }
    if (isAdmin(msg.from?.id)) {
      if (await onAdminWriteText(msg)) return;
      if (await provider(env).onAdminText?.(env, msg)) return;
      if (cmd && (await adminCommand(msg, cmd, rest.join(" ")))) return;
    }

    if (!cmd && (await forwardUserReply(msg))) return;

    const form = await currentForm(env, chatId);

    if (cmd === "/start") return form ? resume(form) : startNew(chatId, msg.from);
    if (cmd === "/mening") return cmdMine(chatId);
    if (cmd === "/yangi") {
      if (form && !form.paid && form.status !== "done") return send(env, chatId, T.unfinishedExists);
      await send(env, chatId, T.newConfirm);
      return startNew(chatId, msg.from);
    }
    if (cmd === "/bekor") {
      if (form && !form.paid && ["filling", "review", "payment"].includes(form.status)) {
        await deleteForm(env, form.id);
        return send(env, chatId, T.cancelled);
      }
      return send(env, chatId, T.nothingToCancel);
    }
    if (cmd === "/help" || cmd === "/yordam") return send(env, chatId, T.help);

    if (!form) return startNew(chatId, msg.from);
    if (cmd) return resume(form);

    if (form.edit_key) return acceptAnswer(form, QUESTIONS[questionIndex(form.edit_key)], msg);
    switch (form.status) {
      case "filling":
        if (!form.alphabet && form.step === 0) return askAlphabet(form);
        return acceptAnswer(form, QUESTIONS[form.step], msg);
      case "review": return showReview(form);
      case "payment":
        if (isAdmin(msg.from?.id)) return adminFree(form);
        return provider(env).onUserMessage(env, form, msg);
      case "pending": return send(env, chatId, T.waitAdmin);
      case "checking": return send(env, chatId, T.waitCheck);
      default: return send(env, chatId, T.menuDone);
    }
  }

  // ---------- Tugmalar ----------
  async function onCallback(cq) {
    const data = cq.data || "";
    const chatId = cq.message?.chat?.id;
    const done = (text) => tg(env, "answerCallbackQuery", { callback_query_id: cq.id, ...(text ? { text } : {}) });

    if (/^(w|ws):\d+$/.test(data) || data === "wc") {
      if (!isAdmin(cq.from.id)) return done();
      if (data === "wc") {
        await clearAdminState(cq.from.id);
        await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } });
        await done();
        return send(env, chatId, T.writeCancelled);
      }
      const id = Number(data.split(":")[1]);
      return data.startsWith("ws:") ? confirmWrite(cq, id) : startWrite(cq, id);
    }

    if (/^(ae|as|ar):\d+$/.test(data) || /^af:\d+:\w+$/.test(data)) {
      if (!isEditor(cq.from.id)) return done();
      const [kind, id, key] = data.split(":");
      if (kind === "ae") return adminEditChoose(cq, Number(id));
      if (kind === "af") return adminEditField(cq, Number(id), key);
      await clearAdminState(cq.from.id);
      return adminDeliver(cq, Number(id), kind === "ar");
    }

    if (/^(ap|rj):\d+$/.test(data)) {
      // yangi qaror tugmasi — boshlangan xabar yozishni bekor qiladi
      if (isAdmin(cq.from.id)) await clearAdminState(cq.from.id);
      if (!isAdmin(cq.from.id)) return done();
      return provider(env).onAdminCallback(env, cq, data, { onPaid });
    }

    // eski xabarlardagi "bepul tahrirlash" tugmasi endi ishlamaydi
    if (data.startsWith("fe:")) {
      await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } });
      return tg(env, "answerCallbackQuery", { callback_query_id: cq.id, text: T.editNotAvailable, show_alert: true });
    }

    const form = await currentForm(env, chatId);
    if (data === "ab:latin" || data === "ab:new") {
      if (!form || form.status !== "filling" || form.alphabet) return done();
      await done();
      await saveForm(env, form, { alphabet: data.slice(3) });
      await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } });
      await send(env, chatId, `✅ ${data === "ab:new" ? T.btnNewAlphabet : T.btnLatin}`);
      return ask(form, 0);
    }
    if (!form || !["review", "filling"].includes(form.status)) return done();
    if (form.status === "filling" && !data.startsWith("e:")) return done();

    if (data === "edit") {
      await done();
      return tg(env, "editMessageReplyMarkup", {
        chat_id: chatId, message_id: cq.message.message_id, ...editKeyboard(form),
      }).then((r) => (r.ok ? r : send(env, chatId, T.chooseEdit, editKeyboard(form))));
    }
    if (data === "back") {
      await done();
      await saveForm(env, form, { edit_key: null });
      await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } });
      return showReview(form);
    }
    if (data.startsWith("e:")) {
      const key = data.slice(2);
      if (questionIndex(key) < 0 || form.status !== "review") return done();
      await done();
      await saveForm(env, form, { edit_key: key });
      return send(env, chatId, T.editAsk(labelOf(form, key)));
    }
    if (data === "ok") {
      if (form.status !== "review") return done();
      await done();
      await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } });
      if (form.paid) {
        // eski (bepul tahrirlash davridagi) to'langan anketani yakunlash
        await saveForm(env, form, { status: "done", free_edit_used: 1, edit_key: null });
        await deliverPdf(form, T.editedPdf);
        return;
      }
      if (isAdmin(cq.from.id)) return adminFree(form);
      await saveForm(env, form, { status: "payment", edit_key: null });
      return provider(env).start(env, form);
    }
    return done();
  }

  return {
    async handle(update) {
      if (update.message) return onMessage(update.message);
      if (update.callback_query) return onCallback(update.callback_query);
    },
    onPaid,
  };
}
