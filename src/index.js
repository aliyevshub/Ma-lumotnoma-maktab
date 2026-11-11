// Cloudflare Worker kiriş nuqtasi: Telegram webhook
import regular from "../fonts/LiberationSerif-Regular.ttf";
import bold from "../fonts/LiberationSerif-Bold.ttf";
import { createBot } from "./bot.js";
import { tg } from "./telegram.js";

const fonts = { regular, bold };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Webhook'ni bot özi ulaydi: GET /setup?key=<WEBHOOK_SECRET>
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
      await tg(env, "setMyCommands", { commands: [
        { command: "start", description: "Anketani boşlaş yoki davom ettiriş" },
        { command: "mening", description: "Tayyor Ma'lumotnomani qayta oliş" },
        { command: "yangi", description: "Boşqa farzand uçun yangi anketa" },
        { command: "bekor", description: "Tugallanmagan anketani öçiriş" },
      ] });
      const me = await tg(env, "getMe");
      return Response.json({ webhook: r, bot: me.result?.username || null });
    }
    if (request.method === "GET") return new Response("Ma'lumotnoma bot işlayapti ✅");
    if (request.method !== "POST" || url.pathname !== "/webhook") return new Response("Not found", { status: 404 });

    if (env.WEBHOOK_SECRET && request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) {
      return new Response("forbidden", { status: 403 });
    }
    let update;
    try { update = await request.json(); } catch { return new Response("bad json", { status: 400 }); }

    try {
      await createBot(env, fonts).handle(update);
    } catch (e) {
      // Telegram qayta-qayta yubormasligi uçun baribir 200 qaytaramiz
      console.log("update xatosi:", e?.stack || e);
    }
    return new Response("ok");
  },
};
