# Ma'lumotnoma bot

Bu Telegram bot ota-onadan anketa javoblarini oladi va qog'oz Ma'lumotnomaga o'xshash PDF tayyorlaydi. Anketa 20 ta savoldan iborat, oxirida 3x4 rasm so'raladi. PDF namunadagi kabi: ramka, sarlavha, o'ng yuqorida rasm.
Ishlash muhiti: **Cloudflare Workers + D1**.

Bot xabarlari oddiy lotin yozuvida (o', g', sh, ch). Anketa (savollar, xulosa, PDF yorliqlari) doim yangi alifboda (ö, ğ, ş, ç); foydalanuvchi va admin oddiy lotinda yozsa ham javoblar avtomatik yangi alifboga o'giriladi.

## Qanday ishlaydi

1. `/start` → savollar birma-bir beriladi. Sana, telefon, ism, sonlar tekshiriladi; oddiy imlo xatolari bepul qoidalar bilan tuzatiladi.
2. Oxirida barcha javoblar va alohida ogohlantirish ko'rsatiladi: **✏️ Tahrirlash** / **✅ Hammasi to'g'ri**.
3. Bot xizmat narxi va karta rekvizitlarini ko'rsatadi. Foydalanuvchi to'lab, chek rasmini yuboradi.
4. Chek adminga keladi: **✅ Tasdiqlash** / **❌ Rad etish** / **✉️ Foydalanuvchiga yozish**. Rad etilsa, admin sababini yozadi; xato rad etilgan chekni **✅ Baribir tasdiqlash** mumkin.
5. Tasdiqlangach, PDF darhol yuborilmaydi: adminga javoblar va qoralama PDF keladi. Admin xatolarni **✏️ Tahrirlash** orqali o'z qo'li bilan tuzatadi va **📤 Foydalanuvchiga yuborish** ni bosadi. Nusxasi adminga ham boradi.
6. To'lovdan keyin ma'lumotlarni o'zgartirib bo'lmaydi (qayta rasmiylashtirish — `/yangi`, qayta to'lov bilan).
7. Bot bazasidan 30 kundan eski anketalar har kuni avtomatik o'chiriladi (Telegram chatlaridagi xabarlarga tegilmaydi).

**Foydalanuvchi buyruqlari:**
- `/start` — anketani boshlash yoki davom ettirish;
- `/mening` — tayyor PDF'ni qayta olish;
- `/yangi` — boshqa farzand uchun yangi anketa;
- `/bekor` — tugallanmagan anketani o'chirish.

**Admin buyruqlari** (faqat admin menyusida ko'rinadi):
- `/stat` — statistika (foydalanuvchilar, anketalar, tushum);
- `/export` — Excel ro'yxat;
- `/pdf 12` — 12-raqamli anketaning PDF'i;
- `/tahrir 12` — yuborilgan anketani tuzatish va **📤 Qayta yuborish** (nusxa ostidagi ✏️ tugmasi ham shu ishni qiladi);
- `/admin` — buyruqlar ro'yxati.

## O'rnatish (bir marta)

```bash
npm install
npx wrangler login
npx wrangler d1 create malumotnoma
```

Oxirgi buyruq chiqargan `database_id` ni `wrangler.toml` faylidagi `BU_YERGA_D1_ID` o'rniga yozing. So'ng jadvallarni yarating:

```bash
npm run db:remote
```

Maxfiy qiymatlarni kiriting. Ular kodda emas, faqat Cloudflare'da saqlanadi:

```bash
npx wrangler secret put BOT_TOKEN        # BotFather bergan token
npx wrangler secret put ADMIN_ID         # admin Telegram ID (bir nechta: 111,222)
npx wrangler secret put EDITOR_ID        # muharrir ID (ixtiyoriy): faqat tahrirlaydi va yuboradi
npx wrangler secret put CARD_NUMBER      # masalan: 8600 1234 5678 9012
npx wrangler secret put CARD_OWNER       # karta egasi ismi
npx wrangler secret put WEBHOOK_SECRET   # istalgan tasodifiy so'z
```

Deploy qiling va Telegram webhook'ini ulang:

```bash
npm run deploy
```

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<worker-manzili>/webhook&secret_token=<WEBHOOK_SECRET>"
```

O'z Telegram ID'ingizni bilish uchun @userinfobot ga yozing.

**Oddiy sozlamalar** `wrangler.toml` → `[vars]` bo'limida:
- `PRICE` — narx;
- `PAYMENT_PROVIDER` — to'lov usuli.

## Lokal sinov

```bash
npm test
```

Bu buyruq quyidagilarni bajaradi:
- soxta Telegram serverini ishga tushiradi;
- lokal D1 bilan `wrangler dev` ni ishga tushiradi;
- butun ssenariyni bosqichma-bosqich sinaydi: anketa, xato sana va telefon, tahrirlash, chek, rad etish, tasdiqlash, PDF, `/mening`, bepul tahrirlash, `/holat`, `/export`.

Natijada yuborilgan PDF va Excel fayllar `test/out/` papkasida qoladi.

PDF ko'rinishini tez tekshirish uchun:

```bash
npm run pdf
```

Natija: `test/out/preview.pdf`.

## Keyinchalik avtomatik to'lov

To'lov kodi alohida joyda: `src/payments/`. Hozir faqat `manual.js` bor (karta va chek). Payme merchant yoki Telegram Stars'ga o'tish uchun:

1. Shu interfeys bilan `payme.js` yoki `stars.js` yoziladi: `start`, `onUserMessage`, `onAdminCallback`, `onAdminText`.
2. U `src/payments/index.js` ga qo'shiladi.
3. `wrangler.toml` da `PAYMENT_PROVIDER` qiymati almashtiriladi.

To'lov tasdiqlanganda yangi provayder `hooks.onPaid(formId)` ni chaqiradi. PDF yuborish va qolgan hamma narsa o'zgarmaydi. `payments` jadvalida `provider` va `external_id` ustunlari oldindan tayyor turibdi.

## Fayllar

| Fayl | Vazifasi |
|---|---|
| `src/questions.js` | savollar, sana va telefon tekshiruvi |
| `src/texts.js` | bot matnlari |
| `src/bot.js` | anketa mantig'i, admin buyruqlari |
| `src/pdf.js` | PDF chizish |
| `src/export.js` | Excel |
| `src/payments/` | to'lov usullari |
| `migrations/` | D1 jadvallari |
| `fonts/` | Liberation Serif shrifti (SIL OFL 1.1) |
