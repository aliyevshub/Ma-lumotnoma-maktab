// Cloudflare Worker kirish nuqtasi: Telegram webhook
import regular from "../fonts/LiberationSerif-Regular.ttf";
import bold from "../fonts/LiberationSerif-Bold.ttf";
import samplePhoto from "../assets/namuna_3x4.jpg";
import { createBot } from "./bot.js";
import { tg } from "./telegram.js";
import { T } from "./texts.js";
import { cleanup } from "./cleanup.js";
import { checkReceipt } from "./receipt.js";

const fonts = { regular, bold, samplePhoto }; // samplePhoto — 3x4 rasm namunasi

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Webhook'ni bot o'zi ulaydi: GET /setup?key=<WEBHOOK_SECRET>
    if (request.method === "GET" && url.pathname === "/setup") {
      if (!env.WEBHOOK_SECRET || url.searchParams.get("key") !== env.WEBHOOK_SECRET) {
        return new Response("forbidden", { status: 403 });
      }
      if (!env.BOT_TOKEN) return new Response("BOT_TOKEN hali kiritilmagan", { status: 400 });
      const r = await tg(env, "setWebhook", {
        url: `${url.origin}/webhook`,
        secret_token: env.WEBHOOK_SECRET,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true,
      });
      const userCommands = [
        { command: "start", description: "Anketani boshlash yoki davom ettirish" },
        { command: "mening", description: "Tayyor Ma'lumotnomani qayta olish" },
        { command: "yangi", description: "Boshqa farzand uchun yangi anketa" },
        { command: "bekor", description: "Tugallanmagan anketani o'chirish" },
      ];
      await tg(env, "setMyCommands", { commands: userCommands });
      // Admin menyusi — faqat admin chatida ko'rinadi
      for (const id of String(env.ADMIN_ID || "").split(",").map((x) => x.trim()).filter(Boolean)) {
        await tg(env, "setMyCommands", {
          scope: { type: "chat", chat_id: Number(id) },
          commands: [
            ...userCommands,
            { command: "stat", description: "Statistika (admin)" },
            { command: "export", description: "Excel ro'yxat (admin)" },
            { command: "tahrir", description: "Hujjatlar ro'yxati va tuzatish (admin)" },
            { command: "kod", description: "Bepul to'lov kodini ko'rish (admin)" },
            { command: "yangikod", description: "Yangi bepul kod: /yangikod KOD (admin)" },
          ],
        });
      }
      // Eski (olib tashlangan) admin/muharrirlar menyusini o'chirish: /setup?key=...&drop=111,222
      for (const id of (url.searchParams.get("drop") || "").split(",").map((x) => x.trim()).filter((x) => /^\d+$/.test(x))) {
        await tg(env, "deleteMyCommands", { scope: { type: "chat", chat_id: Number(id) } });
      }
      // Muharrir menyusi
      for (const id of String(env.EDITOR_ID || "").split(",").map((x) => x.trim()).filter(Boolean)) {
        await tg(env, "setMyCommands", {
          scope: { type: "chat", chat_id: Number(id) },
          commands: [...userCommands, { command: "tahrir", description: "Hujjatlar ro'yxati va tuzatish" }],
        });
      }
      const price = Number(env.PRICE || 5000).toLocaleString("ru-RU").replace(/\u00a0/g, " ");
      const d1 = await tg(env, "setMyDescription", { description: T.botDescription(price) });
      const d2 = await tg(env, "setMyShortDescription", { short_description: T.botShortDescription(price) });
      const n1 = await tg(env, "setMyName", { name: T.botName });
      const me = await tg(env, "getMe");
      return Response.json({ webhook: r, description: d1.ok, short_description: d2.ok, name: n1.ok ? true : n1.description || false, bot: me.result?.username || null });
    }
    // Chek AI tekshiruvini sinash: POST /receipt-test?key=<WEBHOOK_SECRET>, tanasi — rasm
    if (request.method === "POST" && url.pathname === "/receipt-test") {
      if (!env.WEBHOOK_SECRET || url.searchParams.get("key") !== env.WEBHOOK_SECRET) return new Response("forbidden", { status: 403 });
      const bytes = new Uint8Array(await request.arrayBuffer());
      return Response.json(await checkReceipt(env, bytes));
    }
    if (request.method === "GET") return new Response("Ma'lumotnoma bot ishlayapti ✅");
    if (request.method !== "POST" || url.pathname !== "/webhook") return new Response("Not found", { status: 404 });

    if (env.WEBHOOK_SECRET && request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) {
      return new Response("forbidden", { status: 403 });
    }
    let update;
    try { update = await request.json(); } catch { return new Response("bad json", { status: 400 }); }

    try {
      await createBot(env, fonts).handle(update);
    } catch (e) {
      // Telegram qayta-qayta yubormasligi uchun baribir 200 qaytaramiz
      console.log("update xatosi:", e?.stack || e);
    }
    return new Response("ok");
  },

  // Har kuni bir marta (wrangler.toml → [triggers]) — eski anketalarni o'chirish
  async scheduled(event, env, ctx) {
    ctx.waitUntil(cleanup(env));
  },
};
