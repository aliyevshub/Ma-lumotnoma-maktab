// Cloudflare Worker kiriş nuqtasi: Telegram webhook
import regular from "../fonts/LiberationSerif-Regular.ttf";
import bold from "../fonts/LiberationSerif-Bold.ttf";
import { createBot } from "./bot.js";

const fonts = { regular, bold };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
