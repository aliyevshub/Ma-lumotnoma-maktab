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

// ---------- Yordamçilar ----------
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
const wk = spawn("npx", ["wrangler", "dev", "--local", "--port", String(WK_PORT), "--persist-to", STATE,
  ...Object.entries(vars).flatMap(([k, v]) => ["--var", `${k}:${v}`])], { stdio: ["ignore", "pipe", "pipe"], detached: true });
let log = "";
wk.stdout.on("data", (d) => (log += d));
wk.stderr.on("data", (d) => (log += d));

const ANSWERS = [
  "Aliyeva", "Şahzoda", "Bahodirovna", "15.03.2018", "özbek", "Aliyev Bahodir Ğayratoviç",
  "12-maktab, öqituvçi", "Aliyeva Gulçehra", "uy bekasi", "3", "2", "yaxşi", "matematika, rasm",
  "şaxmat", "kitob öqiydi, rasm çizadi", "mehribon", "şifokor böliş", "+998 90 123 45 67",
  "Navbahor MFY, Mustaqillik köçasi, 15-uy",
];

try {
  await waitUp(`http://127.0.0.1:${WK_PORT}/`);
  console.log("Sinov boshlandi:");

  await step("webhook maxfiy kaliti tekshiriladi", async () => {
    assert.equal(await post({}, "notogri"), 403);
  });

  await step("/setup — webhook'ni bot özi ulaydi", async () => {
    assert.equal((await fetch(`http://127.0.0.1:${WK_PORT}/setup?key=xato`)).status, 403);
    const start = calls.length;
    const r = await fetch(`http://127.0.0.1:${WK_PORT}/setup?key=${SECRET}`);
    assert.equal(r.status, 200);
    const wh = calls.slice(start).find((c) => c.method === "setWebhook");
    assert.equal(wh.url, `http://127.0.0.1:${WK_PORT}/webhook`);
    assert.equal(wh.secret_token, SECRET);
  });

  await step("/start — salomlaşiş va 1-savol", async () => {
    const c = await say(USER, "/start");
    has(c, "2A sinfi"); has(c, "Savol 1/20"); has(c, "Familiyasi");
  });

  await step("matn javoblari ketma-ket", async () => {
    for (let i = 0; i < 3; i++) await say(USER, ANSWERS[i]);
  });

  await step("notögri sana rad etiladi", async () => {
    has(await say(USER, "31.02.2018"), "Sana notögri");
    has(await say(USER, "kecha"), "Sana notögri");
    has(await say(USER, "15.03.2099"), "Sana notögri");
    has(await say(USER, "15/3/2018"), "Millati");
  });

  await step("rasm kutilmagan joyda matn sörash", async () => {
    has(await photo(USER, "x"), "matn bilan");
  });

  for (let i = 4; i < 17; i++) await say(USER, ANSWERS[i]);

  await step("notögri telefon rad etiladi", async () => {
    has(await say(USER, "12345"), "Telefon raqami notögri");
    has(await say(USER, "90 123 45 67"), "Yaşaş manzili");
  });

  await step("juda uzun javob rad etiladi", async () => {
    has(await say(USER, "a".repeat(200)), "juda uzun");
  });
  await say(USER, ANSWERS[18]);

  await step("rasm 3x4 sörashda matn rad etiladi, foto qabul qilinadi", async () => {
    has(await say(USER, "rasm yöq"), "rasm (foto)");
    const c = await photo(USER, "face1");
    has(c, "Javoblaringizni tekşiring"); has(c, "15.03.2018"); has(c, "+998 90 123 45 67");
    has(c, "biriktirildi");
    const kb = c.at(-1).reply_markup.inline_keyboard[0].map((b) => b.text);
    assert.deepEqual(kb, ["✏️ Tahrirlaş", "✅ Hammasi tögri"]);
  });

  await step("tahrirlaş: maydon tanlab özgartiriş", async () => {
    const c = await press(USER, "edit");
    assert.equal(c.find((x) => x.method === "editMessageReplyMarkup").reply_markup.inline_keyboard.length, 11);
    has(await press(USER, "e:millati"), "Millati");
    has(await say(USER, "qozoq"), "2. Ismi: Şahzoda");
    const c2 = await say(USER, "nimadir");
    has(c2, "Javoblaringizni tekşiring");
    has(c2, "5. Millati: qozoq");
  });

  await step("tasdiqlaş → karta raqami körsatiladi", async () => {
    const c = await press(USER, "ok");
    has(c, "8600 1234 5678 9012"); has(c, "ALIYEV A."); has(c, "5 000 söm");
  });

  await step("çek ornida matn — çek söraladi", async () => {
    has(await say(USER, "tölladim"), "çekini rasm");
  });

  let paymentId;
  await step("çek → adminga tugmalar bilan boradi", async () => {
    const c = await photo(USER, "receipt1");
    has(c, "Çek qabul qilindi");
    const toAdmin = c.find((x) => x.method === "sendPhoto" && Number(x.chat_id) === ADMIN);
    assert.ok(toAdmin, "admin çekni olmadi");
    assert.equal(toAdmin.photo, "receipt1");
    has([toAdmin], "Aliyeva Şahzoda");
    const btns = toAdmin.reply_markup.inline_keyboard[0];
    assert.deepEqual(btns.map((b) => b.text), ["✅ Tasdiqlaş", "❌ Rad etiş"]);
    paymentId = btns[0].callback_data.split(":")[1];
  });

  await step("tekşiruv paytida foydalanuvçiga kutiş xabari", async () => {
    has(await say(USER, "qaçon?"), "tekşirilmoqda");
  });

  await step("begona odam admin tugmasini bosa olmaydi", async () => {
    const c = await press(USER, `ap:${paymentId}`);
    assert.ok(!c.some((x) => x.method === "sendDocument"));
  });

  await step("rad etiş → sabab → foydalanuvçiga xabar", async () => {
    has(await press(ADMIN, `rj:${paymentId}`, 555), "sababini yozing");
    const c = await say(ADMIN, "Summa notögri");
    has(c, "Sabab: Summa notögri");
    assert.ok(c.some((x) => Number(x.chat_id) === USER), "foydalanuvçiga bormadi");
    has(c, `Çek #${paymentId} rad etildi`);
  });

  await step("rad etilgandan keyin qayta çek", async () => {
    const c = await photo(USER, "receipt2");
    const toAdmin = c.find((x) => x.method === "sendPhoto" && Number(x.chat_id) === ADMIN);
    paymentId = toAdmin.reply_markup.inline_keyboard[0][0].callback_data.split(":")[1];
  });

  await step("tasdiqlaş → PDF foydalanuvçiga va nusxasi adminga", async () => {
    const c = await press(ADMIN, `ap:${paymentId}`, 556);
    has(c, "Tölov tasdiqlandi");
    const doc = c.find((x) => x.method === "sendDocument" && Number(x.chat_id) === USER);
    assert.ok(doc?.document?.file, "PDF yuborilmadi");
    assert.match(doc.document.name, /^Malumotnoma_Aliyeva_Şahzoda\.pdf$/);
    const pdf = readFileSync(doc.document.file);
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    assert.ok(c.some((x) => x.method === "sendDocument" && Number(x.chat_id) === ADMIN), "admin nusxa olmadi");
    const kb = JSON.stringify(c.at(-1).reply_markup);
    assert.ok(kb.includes("Tahrirlaş (1 marta bepul)") && kb.includes("fe:1"), "bepul tahrirlaş tugmasi yöq");
  });

  await step("ikki marta tasdiqlab bölmaydi", async () => {
    const c = await press(ADMIN, `ap:${paymentId}`, 556);
    has(c, "allaqaçon");
  });

  await step("/mening — PDF qayta yuboriladi (file_id orqali)", async () => {
    const c = await say(USER, "/mening");
    const d = c.find((x) => x.method === "sendDocument");
    assert.equal(typeof d.document, "string");
  });

  await step("bepul tahrirlaş: 1 marta", async () => {
    has(await press(USER, "fe:1"), "Qaysi javobni");
    await press(USER, "e:orzular");
    await say(USER, "öqituvçi böliş");
    const c = await press(USER, "ok");
    has(c, "Özgarişlar saqlandi");
    assert.ok(c.some((x) => x.method === "sendDocument" && x.document?.file));
    has(await press(USER, "fe:1"), "Bepul tahrirlaş işlatilgan");
  });

  await step("/holat — statistika", async () => {
    const c = await say(ADMIN, "/holat");
    has(c, "Tayyor (tölangan): 1"); has(c, "Jami tuşum: 5 000 söm");
  });

  await step("/export — Excel fayl", async () => {
    const c = await say(ADMIN, "/export");
    const d = c.find((x) => x.method === "sendDocument");
    assert.match(d.document.name, /\.xlsx$/);
    assert.equal(readFileSync(d.document.file).subarray(0, 2).toString(), "PK");
    writeFileSync(`${OUT}/export.xlsx`, readFileSync(d.document.file));
  });

  await step("/pdf 1 — admin uçun", async () => {
    const c = await say(ADMIN, "/pdf 1");
    assert.ok(c.some((x) => x.method === "sendDocument" && x.document?.file));
    has(await say(ADMIN, "/pdf 99"), "topilmadi");
  });

  await step("/yangi va /bekor", async () => {
    has(await say(USER, "/yangi"), "Savol 1/20");
    has(await say(USER, "/yangi"), "tugallanmagan");
    has(await say(USER, "/bekor"), "öçirildi");
    has(await say(USER, "/mening"), "Ma'lumotnoma");
  });

  await step("admin anketasi tölovsiz — PDF darhol", async () => {
    await say(ADMIN, "/start");
    for (let i = 0; i < 19; i++) await say(ADMIN, ANSWERS[i]);
    await photo(ADMIN, "face2");
    const c = await press(ADMIN, "ok");
    assert.ok(!texts(c).includes("kartaga"), "adminga karta körsatildi");
    has(c, "Tölov tasdiqlandi");
    const docs = c.filter((x) => x.method === "sendDocument" && Number(x.chat_id) === ADMIN);
    assert.equal(docs.length, 1, "admin PDF'ni bir marta olişi kerak");
    has(await say(ADMIN, "/holat"), "Jami tuşum: 5 000 söm");
  });

  console.log(`\nHammasi ötdi: ${passed} ta tekshiruv ✅`);
} catch (e) {
  console.error("\n✗ XATO:", e.message);
  console.error("\n--- wrangler log (oxiri) ---\n" + log.slice(-3000));
  process.exitCode = 1;
} finally {
  try { process.kill(-wk.pid, "SIGTERM"); } catch {}
  tgServer.close();
  setTimeout(() => process.exit(), 500);
}
