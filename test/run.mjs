// Lokal sinov: soxta Telegram server + wrangler dev (lokal D1) + to'liq ssenariy.
//   npm test
import http from "node:http";
import { spawn, execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import assert from "node:assert/strict";

const TG_PORT = 8788, WK_PORT = 8787;
const OUT = "test/out", STATE = `${OUT}/state`;
const USER = 111, ADMIN = 999, SECRET = "test-secret";
const FACE = readFileSync("test/face.jpg");

// ---------- Soxta Telegram ----------
const calls = [];
let msgId = 100, docN = 0;
const tgServer = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  if (req.url.startsWith("/file/")) { res.end(FACE); return; }
  const method = req.url.split("/").pop();
  let payload = {};
  const ct = req.headers["content-type"] || "";
  if (ct.includes("multipart/form-data")) {
    const fd = await new Request("http://x", { method: "POST", headers: { "content-type": ct }, body }).formData();
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string") payload[k] = v;
      else {
        const buf = Buffer.from(await v.arrayBuffer());
        const name = `${OUT}/sent_${++docN}_${v.name}`;
        writeFileSync(name, buf);
        payload[k] = { file: name, name: v.name, size: buf.length };
      }
    }
  } else if (body.length) payload = JSON.parse(body);
  calls.push({ method, ...payload });
  let result = true;
  if (method === "getFile") result = { file_id: payload.file_id, file_path: `photos/${payload.file_id}.jpg` };
  else if (method.startsWith("send")) {
    result = { message_id: ++msgId, chat: { id: Number(payload.chat_id) } };
    if (method === "sendDocument") {
      result.document = { file_id: typeof payload.document === "string" ? payload.document : `pdf_${docN}` };
    }
  }
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ ok: true, result }));
});

// ---------- Yordamchilar ----------
let updateId = 1;
async function post(update, secret = SECRET) {
  const r = await fetch(`http://127.0.0.1:${WK_PORT}/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-Telegram-Bot-Api-Secret-Token": secret },
    body: JSON.stringify({ update_id: updateId++, ...update }),
  });
  return r.status;
}
const from = (id) => ({ id, is_bot: false, first_name: id === ADMIN ? "Admin" : "Ota", username: id === ADMIN ? "admin" : "ota" });
const chat = (id) => ({ id, type: "private" });
async function say(id, text) {
  const start = calls.length;
  await post({ message: { message_id: ++msgId, from: from(id), chat: chat(id), date: 0, text } });
  return calls.slice(start);
}
async function photo(id, fileId) {
  const start = calls.length;
  await post({ message: { message_id: ++msgId, from: from(id), chat: chat(id), date: 0,
    photo: [{ file_id: fileId + "_s", width: 90, height: 120 }, { file_id: fileId, width: 600, height: 800 }] } });
  return calls.slice(start);
}
async function press(id, data, messageId = 1) {
  const start = calls.length;
  await post({ callback_query: { id: String(++msgId), from: from(id), data,
    message: { message_id: messageId, chat: chat(id), date: 0 } } });
  return calls.slice(start);
}
const texts = (cs) => cs.filter((c) => c.text || c.caption).map((c) => c.text || c.caption).join("\n---\n");
const has = (cs, s) => assert.ok(texts(cs).includes(s), `kutilgan: "${s}"\nkeldi:\n${texts(cs)}`);
let passed = 0;
async function step(name, fn) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

async function waitUp(url, ms = 60000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("wrangler dev ishga tushmadi");
}

// ---------- Ishga tushirish ----------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
execSync(`npx wrangler d1 migrations apply malumotnoma --local --persist-to ${STATE}`, { stdio: "ignore", env: { ...process.env, CI: "1" } });
await new Promise((r) => tgServer.listen(TG_PORT, r));
const vars = {
  TG_API_BASE: `http://127.0.0.1:${TG_PORT}`, BOT_TOKEN: "TEST", ADMIN_ID: String(ADMIN),
  CARD_NUMBER: "8600 1234 5678 9012", CARD_OWNER: "ALIYEV A.", WEBHOOK_SECRET: SECRET,
};
const wk = spawn("npx", ["wrangler", "dev", "--local", "--test-scheduled", "--port", String(WK_PORT), "--persist-to", STATE,
  ...Object.entries(vars).flatMap(([k, v]) => ["--var", `${k}:${v}`])], { stdio: ["ignore", "pipe", "pipe"], detached: true });
let log = "";
wk.stdout.on("data", (d) => (log += d));
wk.stderr.on("data", (d) => (log += d));

const ANSWERS = [
  "aliyeva", "Shahzoda", "Bahodirovna", "15.03.2018", "ozbek", "Aliyev Bahodir G'ayratovich",
  "12-maktab, o'qituvchi", "Aliyeva Gulchehra", "uy bekasi", "3", "2", "yaxshi", "matematika, rasm",
  "shaxmat", "kitob o'qiydi, rasm chizadi", "mehrbon", "shifokor bo'lish", "+998 90 123 45 67",
  "Navbahor MFY, Mustaqillik ko'chasi, 15-uy",
];

try {
  await waitUp(`http://127.0.0.1:${WK_PORT}/`);
  console.log("Sinov boshlandi:");

  await step("webhook maxfiy kaliti tekshiriladi", async () => {
    assert.equal(await post({}, "noto'g'ri"), 403);
  });

  await step("/setup — webhook'ni bot o'zi ulaydi", async () => {
    assert.equal((await fetch(`http://127.0.0.1:${WK_PORT}/setup?key=xato`)).status, 403);
    const start = calls.length;
    const r = await fetch(`http://127.0.0.1:${WK_PORT}/setup?key=${SECRET}`);
    assert.equal(r.status, 200);
    const wh = calls.slice(start).find((c) => c.method === "setWebhook");
    assert.equal(wh.url, `http://127.0.0.1:${WK_PORT}/webhook`);
    assert.equal(wh.secret_token, SECRET);
    const desc = calls.slice(start).find((c) => c.method === "setMyDescription");
    assert.ok(!desc.description.includes("2A") && desc.description.includes("Start"));
    assert.ok(calls.slice(start).some((c) => c.method === "setMyShortDescription"));
  });

  await step("/start — salomlashish va 1-savol", async () => {
    const c = await say(USER, "/start");
    has(c, "rasmiylashtirish boshlandi"); assert.ok(!texts(c).includes("2A")); has(c, "Savol 1/20"); has(c, "Familiyasi");
  });

  await step("matn javoblari ketma-ket", async () => {
    for (let i = 0; i < 3; i++) await say(USER, ANSWERS[i]);
  });

  await step("noto'g'ri sana rad etiladi", async () => {
    has(await say(USER, "31.02.2018"), "Sana noto'g'ri kiritilgan");
    has(await say(USER, "kecha"), "Sana noto'g'ri kiritilgan");
    has(await say(USER, "15.03.2099"), "Sana noto'g'ri kiritilgan");
    has(await say(USER, "15/3/2018"), "Millati");
  });

  await step("rasm kutilmagan joyda matn so'rash", async () => {
    has(await photo(USER, "x"), "matn shaklida");
  });

  for (let i = 4; i < 17; i++) await say(USER, ANSWERS[i]);

  await step("noto'g'ri telefon rad etiladi", async () => {
    has(await say(USER, "12345"), "Telefon raqami noto'g'ri kiritilgan");
    has(await say(USER, "90 123 45 67"), "Yashash manzili");
  });

  await step("juda uzun javob rad etiladi", async () => {
    has(await say(USER, "a".repeat(200)), "juda uzun");
  });
  await say(USER, ANSWERS[18]);

  await step("rasm 3x4 so'rashda matn rad etiladi, foto qabul qilinadi", async () => {
    has(await say(USER, "rasm yo'q"), "rasm (foto)");
    const c = await photo(USER, "face1");
    has(c, "Kiritilgan ma'lumotlarni tekshiring"); has(c, "15.03.2018"); has(c, "+998 90 123 45 67");
    has(c, "biriktirilgan");
    // imlo tuzatish (bepul qoidalar)
    has(c, "1. Familiyasi: Aliyeva"); has(c, "5. Millati: o'zbek");
    has(c, "20. Rasm 3x4: biriktirilgan ✅");
    assert.ok(!texts(c).includes("suratni rasm (foto) qilib yuboring:"), "20-bandda ko'rsatma chiqdi");
    // ogohlantirish alohida xabar, tugmalar uning ostida
    const msgs = c.filter((x) => x.method === "sendMessage");
    const summaryMsg = msgs.at(-2), warn = msgs.at(-1);
    assert.ok(summaryMsg.text.startsWith("Kiritilgan ma'lumotlarni tekshiring") && !summaryMsg.reply_markup);
    assert.ok(warn.text.startsWith("⚠️ Diqqat!") && warn.text.includes("xizmat haqi qayta to'lanadi"));
    const kb = c.at(-1).reply_markup.inline_keyboard[0].map((b) => b.text);
    assert.deepEqual(kb, ["✏️ Tahrirlash", "✅ Hammasi to'g'ri"]);
  });

  await step("tahrirlash: maydon tanlab o'zgartirish", async () => {
    const c = await press(USER, "edit");
    assert.equal(c.find((x) => x.method === "editMessageReplyMarkup").reply_markup.inline_keyboard.length, 11);
    has(await press(USER, "e:millati"), "Millati");
    has(await say(USER, "qozoq"), "2. Ismi: Shahzoda");
    const c2 = await say(USER, "nimadir");
    has(c2, "Kiritilgan ma'lumotlarni tekshiring");
    has(c2, "5. Millati: qozoq");
  });

  await step("tasdiqlash → karta raqami ko'rsatiladi", async () => {
    const c = await press(USER, "ok");
    has(c, "Karta raqami: <code>8600 1234 5678 9012</code>"); has(c, "Karta egasi: ALIYEV A."); has(c, "To'lov tartibi");
    assert.ok(!texts(c).includes("nusxalash uchun raqam ustiga")); has(c, "ALIYEV A."); has(c, "5 000 so'm");
    const m = c.find((x) => x.text?.includes("<code>"));
    assert.equal(m.parse_mode, "HTML");
    assert.equal(m.reply_markup.inline_keyboard[0][0].copy_text.text, "8600123456789012");
  });

  await step("chek ornida matn — chek so'raladi", async () => {
    has(await say(USER, "to'lladim"), "chekini rasm yoki fayl");
  });

  let paymentId;
  await step("chek → adminga tugmalar bilan boradi", async () => {
    const c = await photo(USER, "receipt1");
    has(c, "To'lov cheki qabul qilindi");
    const toAdmin = c.find((x) => x.method === "sendPhoto" && Number(x.chat_id) === ADMIN);
    assert.ok(toAdmin, "admin chekni olmadi");
    assert.equal(toAdmin.photo, "receipt1");
    has([toAdmin], "Aliyeva Shahzoda");
    const btns = toAdmin.reply_markup.inline_keyboard[0];
    assert.deepEqual(btns.map((b) => b.text), ["✅ Tasdiqlash", "❌ Rad etish"]);
    paymentId = btns[0].callback_data.split(":")[1];
  });

  await step("tekshiruv paytida foydalanuvchiga kutish xabari", async () => {
    has(await say(USER, "qachon?"), "tekshirilmoqda");
  });

  await step("begona odam admin tugmasini bosa olmaydi", async () => {
    const c = await press(USER, `ap:${paymentId}`);
    assert.ok(!c.some((x) => x.method === "sendDocument"));
  });

  await step("rad etish → sabab → foydalanuvchiga xabar", async () => {
    has(await press(ADMIN, `rj:${paymentId}`, 555), "sababini yozing");
    const c = await say(ADMIN, "Summa noto'g'ri");
    has(c, "Sabab: Summa noto'g'ri");
    assert.ok(c.some((x) => Number(x.chat_id) === USER), "foydalanuvchiga bormadi");
    has(c, `Chek #${paymentId} rad etildi`);
  });

  await step("rad etilgandan keyin qayta chek", async () => {
    const c = await photo(USER, "receipt2");
    const toAdmin = c.find((x) => x.method === "sendPhoto" && Number(x.chat_id) === ADMIN);
    paymentId = toAdmin.reply_markup.inline_keyboard[0][0].callback_data.split(":")[1];
  });

  await step("tasdiqlash → PDF foydalanuvchiga va nusxasi adminga", async () => {
    const c = await press(ADMIN, `ap:${paymentId}`, 556);
    has(c, "To'lov tasdiqlandi");
    const doc = c.find((x) => x.method === "sendDocument" && Number(x.chat_id) === USER);
    assert.ok(doc?.document?.file, "PDF yuborilmadi");
    assert.match(doc.document.name, /^Malumotnoma_Aliyeva_Shahzoda\.pdf$/);
    const pdf = readFileSync(doc.document.file);
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    assert.ok(c.some((x) => x.method === "sendDocument" && Number(x.chat_id) === ADMIN), "admin nusxa olmadi");
    assert.ok(!JSON.stringify(c).includes("fe:"), "bepul tahrirlash tugmasi chiqmasligi kerak");
  });

  await step("ikki marta tasdiqlab bo'lmaydi", async () => {
    const c = await press(ADMIN, `ap:${paymentId}`, 556);
    has(c, "allaqachon");
  });

  await step("/mening — PDF qayta yuboriladi (file_id orqali)", async () => {
    const c = await say(USER, "/mening");
    const d = c.find((x) => x.method === "sendDocument");
    assert.equal(typeof d.document, "string");
  });

  await step("to'langan hujjatni tahrirlab bo'lmaydi (eski tugma ham ishlamaydi)", async () => {
    const c = await press(USER, "fe:1");
    assert.ok(JSON.stringify(c).includes("o'zgartirish kiritish imkoni mavjud emas"));
    assert.ok(!c.some((x) => x.method === "sendDocument" || (x.text || "").includes("bandni tanlang")));
    assert.ok(!JSON.stringify(await say(USER, "/mening")).includes("fe:"));
  });

  await step("/holat — statistika", async () => {
    const c = await say(ADMIN, "/holat");
    has(c, "Tayyor (to'langan): 1"); has(c, "Jami tushum: 5 000 so'm");
  });

  await step("/export — Excel fayl", async () => {
    const c = await say(ADMIN, "/export");
    const d = c.find((x) => x.method === "sendDocument");
    assert.match(d.document.name, /\.xlsx$/);
    assert.equal(readFileSync(d.document.file).subarray(0, 2).toString(), "PK");
    writeFileSync(`${OUT}/export.xlsx`, readFileSync(d.document.file));
  });

  await step("/pdf 1 — admin uchun", async () => {
    const c = await say(ADMIN, "/pdf 1");
    assert.ok(c.some((x) => x.method === "sendDocument" && x.document?.file));
    has(await say(ADMIN, "/pdf 99"), "topilmadi");
  });

  await step("/yangi va /bekor", async () => {
    has(await say(USER, "/yangi"), "Savol 1/20");
    has(await say(USER, "/yangi"), "yakunlanmagan anketa mavjud");
    has(await say(USER, "/bekor"), "bekor qilindi");
    has(await say(USER, "/mening"), "Ma'lumotnoma");
  });

  await step("admin anketasi to'lovsiz — PDF darhol", async () => {
    await say(ADMIN, "/start");
    for (let i = 0; i < 19; i++) await say(ADMIN, ANSWERS[i]);
    await photo(ADMIN, "face2");
    const c = await press(ADMIN, "ok");
    assert.ok(!texts(c).includes("karta raqamiga"), "adminga karta ko'rsatildi");
    has(c, "To'lov tasdiqlandi");
    const docs = c.filter((x) => x.method === "sendDocument" && Number(x.chat_id) === ADMIN);
    assert.equal(docs.length, 1, "admin PDF'ni bir marta olishi kerak");
    has(await say(ADMIN, "/holat"), "Jami tushum: 5 000 so'm");
  });

  const USER2 = 222;
  const sentTo = (cs, id) => cs.filter((x) => Number(x.chat_id) === id && (x.text || x.caption));

  await step("xabar yozish: tugma → kimga ekani → tasdiq → yuboriladi", async () => {
    has(await press(ADMIN, "w:1", 700), "Xabar kimga: Aliyeva Shahzoda (anketa #1)");
    const c = await say(ADMIN, "Assalomu alaykum, tekshiruv xabari");
    has(c, "Kimga: Aliyeva Shahzoda (anketa #1)");
    assert.equal(sentTo(c, USER).length, 0, "tasdiqsiz yuborildi!");
    const kb = c.at(-1).reply_markup.inline_keyboard[0].map((b) => b.callback_data);
    assert.deepEqual(kb, ["ws:1", "wc"]);
    const c2 = await press(ADMIN, "ws:1", 701);
    const toUser = sentTo(c2, USER);
    assert.equal(toUser.length, 1);
    assert.ok(toUser[0].text.startsWith("✉️ Administrator xabari (anketa #1)"));
    assert.ok(toUser[0].text.includes("tekshiruv xabari"));
    has(c2, "Yuborildi: Aliyeva Shahzoda");
  });

  await step("xabar yozish: Bekor — hech narsa ketmaydi", async () => {
    await press(ADMIN, "w:1", 702);
    await say(ADMIN, "yuborilmasligi kerak");
    const c = await press(ADMIN, "wc", 703);
    has(c, "bekor qilindi");
    assert.equal(sentTo(c, USER).length, 0);
    const c2 = await press(ADMIN, "ws:1", 703);
    assert.equal(sentTo(c2, USER).length, 0, "bekor qilingandan keyin yuborildi!");
  });

  await step("xabar yozish: boshqa anketa tugmasi bosilsa, eski tasdiq ishlamaydi", async () => {
    await press(ADMIN, "w:1", 704);
    await say(ADMIN, "1-anketaga xabar");
    has(await press(ADMIN, "w:3", 705), "anketa #3");
    const c = await press(ADMIN, "ws:1", 706);
    assert.equal(sentTo(c, USER).length, 0, "eski tasdiq bilan yuborildi!");
    assert.ok(JSON.stringify(c).includes("amal qilmaydi"));
    await say(ADMIN, "/bekor");
  });

  await step("foydalanuvchi admin xabariga javob beradi → adminga keladi", async () => {
    const start = calls.length;
    await post({ message: { message_id: ++msgId, from: from(USER), chat: chat(USER), date: 0, text: "Rahmat, tushundim",
      reply_to_message: { message_id: 5, from: { id: 1, is_bot: true, first_name: "bot" }, chat: chat(USER), date: 0,
        text: "✉️ Administrator xabari (anketa #1):\n\nsalom" } } });
    const c = calls.slice(start);
    has(c, "Javob: Aliyeva Shahzoda (anketa #1)");
    assert.ok(c.some((x) => x.method === "copyMessage" && Number(x.chat_id) === ADMIN));
    has(c, "administratorga yuborildi");
  });

  await step("xato rad etilgan chekni «Baribir tasdiqlash» bilan tasdiqlash", async () => {
    await say(USER2, "/start");
    for (let i = 0; i < 19; i++) await say(USER2, ANSWERS[i].replace("Shahzoda", "Madina"));
    await photo(USER2, "face3");
    await press(USER2, "ok");
    const c = await photo(USER2, "receipt9");
    const adm = c.find((x) => x.method === "sendPhoto" && Number(x.chat_id) === ADMIN);
    const rows = adm.reply_markup.inline_keyboard;
    assert.equal(rows[1][0].text, "✉️ Foydalanuvchiga yozish");
    const pid = rows[0][0].callback_data.split(":")[1];
    await press(ADMIN, `rj:${pid}`, 800);
    const r = await say(ADMIN, "Pul kelmadi");
    const edit = r.find((x) => x.method === "editMessageReplyMarkup");
    assert.equal(edit.reply_markup.inline_keyboard[0][0].callback_data, `ap:${pid}`);
    const c2 = await press(ADMIN, `ap:${pid}`, 800);
    has(c2, "To'lov tasdiqlandi");
    assert.ok(c2.some((x) => x.method === "sendDocument" && Number(x.chat_id) === USER2 && x.document?.file));
    has(await press(ADMIN, `ap:${pid}`, 800), "allaqachon");
  });

  await step("tahrirlangan javob ham qoidalar bilan tuzatiladi", async () => {
    const U = 444;
    await say(U, "/start");
    for (let i = 0; i < 19; i++) await say(U, ANSWERS[i]);
    await photo(U, "face5");
    await press(U, "edit");
    await press(U, "e:fel_atvor");
    has(await say(U, "  sabrli ,  mehrbon "), "sabrli, mehribon");
  });

  await step("javoblarni tekshirish: ma'nosiz javoblar qabul qilinmaydi", async () => {
    const U = 555;
    await say(U, "/start");
    has(await say(U, "Hus1"), "faqat harflardan");
    for (let i = 0; i < 4; i++) await say(U, ANSWERS[i]);
    has(await say(U, "$3&"), "faqat harflardan");
    await say(U, ANSWERS[4]);
    has(await say(U, "Jwjw"), "to'liq kiriting");
    for (let i = 5; i < 9; i++) await say(U, ANSWERS[i]);
    has(await say(U, "je"), "raqam bilan");
    has(await say(U, "3 ta"), "Oilada nechanchi farzand");
    has(await say(U, "5"), "sonidan katta bo'lishi mumkin emas");
    has(await say(U, "2"), "Oilaviy sharoiti");
    has(await say(U, "!!"), "to'g'ri kiriting");
    await say(U, ANSWERS[11]);
    for (let i = 12; i < 19; i++) await say(U, ANSWERS[i]);
    const c = await photo(U, "face6");
    has(c, "10. Oilada nechta farzand: 3"); has(c, "11. Oilada nechanchi farzand: 2");
  });

  await step("PDF'dan keyin «hujjatni saqlab qo'ying» eslatmasi", async () => {
    const c = await say(USER, "salom");
    has(c, "30 kundan so'ng tizimdan o'chiriladi");
  });

  await step("avtomatik tozalash: 30 kundan eski anketalar bazadan o'chadi", async () => {
    execSync(`npx wrangler d1 execute malumotnoma --local --persist-to ${STATE} --command "UPDATE forms SET created_at = datetime('now','-31 days') WHERE id = 1; UPDATE payments SET created_at = datetime('now','-31 days') WHERE form_id = 1;"`, { stdio: "ignore", env: { ...process.env, CI: "1" } });
    const r = await fetch(`http://127.0.0.1:${WK_PORT}/__scheduled?cron=17+2+*+*+*`);
    assert.equal(r.status, 200);
    await new Promise((res) => setTimeout(res, 1000));
    has(await say(USER, "/mening"), "mavjud emas");
    // statistika uchun summa qoladi
    has(await say(ADMIN, "/holat"), "Jami tushum: 10 000 so'm");
    has(await say(USER2, "/mening"), "Ma'lumotnoma");
  });

  console.log(`\nHammasi o'tdi: ${passed} ta tekshiruv ✅`);
} catch (e) {
  console.error("\n✗ XATO:", e.message);
  console.error("\n--- wrangler log (oxiri) ---\n" + log.slice(-3000));
  process.exitCode = 1;
} finally {
  try { process.kill(-wk.pid, "SIGTERM"); } catch {}
  tgServer.close();
  setTimeout(() => process.exit(), 500);
}
