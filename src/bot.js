// Bot mantiği: anketa, tekşiriş, tahrirlaş, PDF, admin buyruqlari
import { tg, send, sendPdf, sendFile, inlineKeyboard, downloadFile } from "./telegram.js";
import { QUESTIONS, MAX_LEN, MAX_LEN_LONG, questionIndex, parseDate, parsePhone } from "./questions.js";
import {
  currentForm, formById, createForm, saveForm, deleteForm, paidForms, allPaidForms, displayName,
} from "./db.js";
import { provider, adminIds } from "./payments/index.js";
import { buildPdf } from "./pdf.js";
import { buildXlsx } from "./export.js";
import { T } from "./texts.js";

export function createBot(env, fonts) {
  const isAdmin = (id) => adminIds(env).includes(String(id));
  const cls = env.CLASS_NAME || "2A";
  const priceText = () => Number(env.PRICE || 5000).toLocaleString("ru-RU").replace(/ /g, " ");

  // ---------- Savol berish va xulosa ----------
  async function ask(form, idx) {
    const q = QUESTIONS[idx];
    const head = T.progress(idx + 1, QUESTIONS.length);
    await send(env, form.chat_id, `${head}\n\n${q.prompt || q.label}`);
  }

  function summary(form) {
    const lines = QUESTIONS.map((q, i) => {
      const v = q.type === "photo" ? (form.photo_file_id ? T.photoAttached : "—") : (form.answers[q.key] || "—");
      const label = q.prompt ? q.prompt.split("\n")[0] : q.label;
      return `${i + 1}. ${label}: ${v}`;
    });
    return `${T.reviewTitle}\n\nSinf: ${cls}\n${lines.join("\n")}`;
  }

  async function showReview(form) {
    await send(env, form.chat_id, summary(form), inlineKeyboard([[
      { text: T.btnEdit, callback_data: "edit" },
      { text: T.btnConfirm, callback_data: "ok" },
    ]]));
  }

  function editKeyboard() {
    const rows = [];
    QUESTIONS.forEach((q, i) => {
      const label = (q.prompt ? q.prompt.split("\n")[0] : q.label).replace(/\s*\(.*\)$/, "");
      const btn = { text: `${i + 1}. ${label}`.slice(0, 40), callback_data: `e:${q.key}` };
      if (i % 2 === 0) rows.push([btn]); else rows[rows.length - 1].push(btn);
    });
    rows.push([{ text: T.btnBack, callback_data: "back" }]);
    return inlineKeyboard(rows);
  }

  // ---------- PDF ----------
  async function makePdf(form) {
    const photo = form.photo_file_id ? await downloadFile(env, form.photo_file_id) : null;
    return buildPdf(fonts, form.answers, photo);
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
      for (const a of adminIds(env)) {
        if (String(a) === String(form.chat_id)) continue;
        await tg(env, "sendDocument", {
          chat_id: a, document: fileId, caption: `${T.adminPdfCopy(displayName(form))} (#${form.id})`,
          ...inlineKeyboard([[{ text: T.btnWrite, callback_data: `w:${form.id}` }]]),
        });
      }
    } catch (e) {
      console.log("PDF xato:", e?.stack || e);
      await send(env, form.chat_id, T.pdfError);
      for (const a of adminIds(env)) await send(env, a, `⚠️ Anketa #${form.id} PDF xatosi: ${e?.message || e}`);
    }
  }

  // Tölov tasdiqlanganda (har qanday tölov usulidan)
  async function onPaid(formId) {
    const form = await formById(env, formId);
    if (!form) return;
    await saveForm(env, form, { paid: 1, status: "done", edit_key: null });
    await deliverPdf(form, T.approved);
    await send(env, form.chat_id, T.menuDone, inlineKeyboard([[{ text: T.btnFreeEdit, callback_data: `fe:${form.id}` }]]));
  }

  // Admin uçun tölov yöq — PDF darhol
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
    await send(env, chatId, T.welcome(cls, priceText()));
    await ask(form, 0);
  }

  async function resume(form) {
    switch (form.status) {
      case "filling":
        if (form.edit_key) return send(env, form.chat_id, T.editAsk(labelOf(form.edit_key)));
        await send(env, form.chat_id, T.resume);
        return ask(form, form.step);
      case "review":
        if (form.edit_key) return send(env, form.chat_id, T.editAsk(labelOf(form.edit_key)));
        return showReview(form);
      case "payment":
        if (isAdmin(form.chat_id)) return adminFree(form);
        return provider(env).start(env, form);
      case "pending": return send(env, form.chat_id, T.waitAdmin);
      default: return send(env, form.chat_id, T.menuDone);
    }
  }

  function labelOf(key) {
    const q = QUESTIONS[questionIndex(key)];
    return q ? (q.prompt || q.label) : key;
  }

  async function cmdMine(chatId) {
    const forms = await paidForms(env, chatId);
    if (!forms.length) return send(env, chatId, T.noPaid);
    for (const f of forms) {
      const kb = f.free_edit_used ? {} : inlineKeyboard([[{ text: T.btnFreeEdit, callback_data: `fe:${f.id}` }]]);
      if (f.pdf_file_id) {
        const r = await tg(env, "sendDocument", { chat_id: chatId, document: f.pdf_file_id, caption: T.pdfCaption(displayName(f)), ...kb });
        if (r.ok) continue;
      }
      await deliverPdf(f);
      if (!f.free_edit_used) await send(env, chatId, T.menuDone, kb);
    }
  }

  // ---------- Admin ----------
  async function adminCommand(msg, cmd, arg) {
    const chatId = msg.chat.id;
    if (cmd === "/holat") {
      const { results } = await env.DB.prepare("SELECT status, paid, COUNT(*) n FROM forms GROUP BY status, paid").all();
      const s = { filling: 0, payment: 0, pending: 0, done: 0 };
      for (const r of results) {
        if (r.paid) s.done += r.n;
        else if (r.status === "filling" || r.status === "review") s.filling += r.n;
        else if (s[r.status] != null) s[r.status] += r.n;
      }
      const sum = await env.DB.prepare("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status = 'approved'").first();
      s.sum = Number(sum.s).toLocaleString("ru-RU").replace(/ /g, " ");
      await send(env, chatId, T.adminStats(cls, s));
      return true;
    }
    if (cmd === "/export") {
      const forms = await allPaidForms(env);
      if (!forms.length) { await send(env, chatId, T.adminNoData); return true; }
      const bytes = buildXlsx(forms, cls);
      const date = new Date().toISOString().slice(0, 10);
      await sendFile(env, chatId, bytes, `Malumotnoma_${cls}_${date}.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", `${cls}: ${forms.length} ta anketa`);
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

  // ---------- Admin → foydalanuvçi xabari ----------
  // Xavfsizlik: yoziş faqat aniq anketa tugmasidan boşlanadi, yuboriştan oldin
  // qabul qiluvçi ismi bilan tasdiq söraladi; yangi tugma eski holatni almaştiradi.
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

  // true — xabar şu yerda qayta işlandi
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
    // eski yoki boşqa anketaga tegişli tasdiq tugmasi işlamaydi
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

  // Foydalanuvçi admin xabariga javob (reply) qilsa — adminga yetkaziladi
  async function forwardUserReply(msg) {
    const orig = msg.reply_to_message;
    const m = orig?.from?.is_bot && (orig.text || "").match(/^✉️ Admin xabari \(anketa #(\d+)\)/);
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
  async function onMessage(msg) {
    if (msg.chat?.type !== "private") return;
    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();
    const [rawCmd, ...rest] = text.startsWith("/") ? text.split(/\s+/) : [""];
    const cmd = rawCmd.split("@")[0].toLowerCase();

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
      case "filling": return acceptAnswer(form, QUESTIONS[form.step], msg);
      case "review": return showReview(form);
      case "payment":
        if (isAdmin(msg.from?.id)) return adminFree(form);
        return provider(env).onUserMessage(env, form, msg);
      case "pending": return send(env, chatId, T.waitAdmin);
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

    if (/^(ap|rj):\d+$/.test(data)) {
      // yangi qaror tugmasi — boşlangan xabar yozişni bekor qiladi
      if (isAdmin(cq.from.id)) await clearAdminState(cq.from.id);
      if (!isAdmin(cq.from.id)) return done();
      return provider(env).onAdminCallback(env, cq, data, { onPaid });
    }

    if (data.startsWith("fe:")) {
      const f = await formById(env, Number(data.slice(3)));
      if (!f || f.chat_id !== chatId || !f.paid) return done();
      if (f.free_edit_used) return done(T.freeEditUsed);
      await done();
      await saveForm(env, f, { status: "review", edit_key: null });
      await send(env, chatId, T.chooseEdit, editKeyboard());
      return;
    }

    const form = await currentForm(env, chatId);
    if (!form || !["review", "filling"].includes(form.status)) return done();
    // tölangan anketada faqat bepul tahrirlaş (review) holatida
    if (form.status === "filling" && !data.startsWith("e:")) return done();

    if (data === "edit") {
      await done();
      return tg(env, "editMessageReplyMarkup", {
        chat_id: chatId, message_id: cq.message.message_id, ...editKeyboard(),
      }).then((r) => (r.ok ? r : send(env, chatId, T.chooseEdit, editKeyboard())));
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
      return send(env, chatId, T.editAsk(labelOf(key)));
    }
    if (data === "ok") {
      if (form.status !== "review") return done();
      await done();
      await tg(env, "editMessageReplyMarkup", { chat_id: chatId, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } });
      if (form.paid) {
        // tasdiqdan keyingi bepul tahrirlaş yakuni
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
