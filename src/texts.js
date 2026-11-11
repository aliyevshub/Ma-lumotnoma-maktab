// Barcha bot matnlari — oddiy lotin yozuvida (sh, ch, o', g').
export const T = {
  // Start bosishdan oldin bot chatida ko'rinadigan matn (setMyDescription)
  botDescription: (price) =>
    `Assalomu alaykum!\n` +
    `Ushbu bot orqali o'quvchi Ma'lumotnomasi rasmiylashtiriladi.\n` +
    `Tartib: anketa savollariga javob beriladi, 3x4 rasm yuboriladi va tayyor hujjat PDF shaklida yuboriladi.\n` +
    `Xizmat narxi: ${price} so'm.\n` +
    `Boshlash uchun «Start» tugmasini bosing.`,
  // Botning ko'rinadigan nomi (setMyName)
  botName: "📝 Ma'lumotnoma | PDF tayyorlash",
  // Bot profilidagi qisqa yozuv (setMyShortDescription)
  botShortDescription: () => `O'quvchi Ma'lumotnomasini rasmiylashtirish xizmati. Hujjat PDF shaklida taqdim etiladi.`,
  welcome: () =>
    `Assalomu alaykum! Ma'lumotnomani rasmiylashtirish boshlandi.\n` +
    `Iltimos, savollarga ketma-ket javob bering.`,
  resume: "Anketani to'ldirish davom ettiriladi.",
  chooseAlphabet: "Anketani qaysi yozuvda to'ldirasiz?",
  btnLatin: "Lotin (o', g', sh, ch)",
  btnNewAlphabet: "Yangi alifbo (ö, ğ, ş, ç)",
  progress: (n, total) => `Savol ${n}/${total}`,
  badDate: "Sana noto'g'ri kiritilgan. Iltimos, kun.oy.yil shaklida kiriting (masalan: 15.03.2018).",
  badPhone: "Telefon raqami noto'g'ri kiritilgan. Namuna: +998 90 123 45 67",
  needText: "Iltimos, javobni matn shaklida kiriting.",
  badName: "Iltimos, faqat harflardan foydalaning.",
  badFio: "Iltimos, familiya, ism va sharifni to'liq kiriting.",
  badCount: "Iltimos, sonni raqam bilan kiriting (masalan: 3).",
  badOrder: "Farzand tartib raqami farzandlar sonidan katta bo'lishi mumkin emas.",
  badCountLess: "Farzandlar soni farzand tartib raqamidan kam bo'lishi mumkin emas.",
  badText: "Iltimos, javobni to'g'ri kiriting.",
  needPhoto: "Iltimos, 3x4 o'lchamdagi suratni rasm (foto) shaklida yuboring.",
  tooLong: (n) => `Javob juda uzun. Iltimos, ${n} belgidan oshirmang.`,
  reviewTitle: "Kiritilgan ma'lumotlarni tekshiring:",
  photoAttached: "biriktirilgan ✅",
  reviewWarning:
    "⚠️ Diqqat! Iltimos, kiritilgan ma'lumotlarning to'g'riligini sinchkovlik bilan tekshiring. " +
    "To'lov amalga oshirilgach, hujjat ushbu ma'lumotlar asosida rasmiylashtiriladi va keyinchalik " +
    "ularga o'zgartirish kiritish imkoni bo'lmaydi. Ma'lumotlarni o'zgartirish yoki hujjatni qayta " +
    "rasmiylashtirish uchun xizmat haqi qayta to'lanadi.",
  btnEdit: "✏️ Tahrirlash",
  btnConfirm: "✅ Hammasi to'g'ri",
  btnBack: "⬅️ Orqaga",
  chooseEdit: "O'zgartirilishi lozim bo'lgan bandni tanlang:",
  editAsk: (label) => `Yangi ma'lumotni kiriting:\n\n${label}`,

  // HTML: karta raqami <code> ichida — bosilsa nusxalanadi
  payInfo: (price, card, owner) =>
    `📄 <b>Anketa qabul qilindi</b>\n` +
    `━━━━━━━━━━━━━━━\n` +
    `💰 <b>Xizmat narxi:</b> ${price} so'm\n\n` +
    `💳 <b>To'lov rekvizitlari</b>\n` +
    `Karta raqami: <code>${card}</code>\n` +
    `Karta egasi: ${owner}\n\n` +
    `📌 <b>To'lov tartibi</b>\n` +
    `1. Payme, Click yoki bank ilovasi orqali ko'rsatilgan karta raqamiga to'lovni amalga oshiring.\n` +
    `2. To'lov chekini (skrinshot) shu yerga yuboring.\n` +
    `3. Chek tekshirilgach, Ma'lumotnoma PDF shaklida yuboriladi.\n\n` +
    `ℹ️ <i>Hujjat to'lov tekshiruvidan so'ng yuboriladi; bu jarayon bir necha soat davom etishi mumkin.</i>`,
  btnCopyCard: "📋 Karta raqamini nusxalash",
  receiptReceived:
    "To'lov cheki qabul qilindi ✅\n" +
    "Chek tekshirilgach, Ma'lumotnoma shu yerga yuboriladi. " +
    "Tekshiruv bir necha soat davom etishi mumkin. Iltimos, kuting — qayta chek yuborish shart emas.",
  waitAdmin:
    "To'lov cheki tekshirilmoqda. Ma'lumotnoma tekshiruvdan so'ng yuboriladi. " +
    "Tekshiruv bir necha soat davom etishi mumkin.",
  needReceipt: "Iltimos, to'lov chekini rasm yoki fayl shaklida yuboring.",
  approved: "To'lov tasdiqlandi ✅ Ma'lumotnoma quyida ilova qilingan:",
  approvedChecking: "To'lov tasdiqlandi ✅ Hujjat tekshirilmoqda va tez orada yuboriladi.",
  waitCheck: "Hujjatingiz tekshirilmoqda va tez orada yuboriladi.",
  docReady: "Ma'lumotnoma tayyor ✅ Hujjat quyida ilova qilingan:",
  correctedPdf: "Ma'lumotnomangiz tuzatildi ✅ Yangilangan hujjat:",
  rejected: (reason) =>
    `To'lov tasdiqlanmadi ❌\nSabab: ${reason}\n\nIltimos, to'g'ri to'lov chekini qayta yuboring.`,
  pdfCaption: (name) => `Ma'lumotnoma — ${name}`,
  pdfError: "Hujjatni tayyorlashda texnik xatolik yuz berdi. Administrator xabardor qilindi, hujjat qisqa vaqt ichida yuboriladi.",

  menuDone:
    "Ma'lumotnoma rasmiylashtirildi.\n" +
    "Iltimos, hujjatni saqlab qo'ying: ma'lumotlar 30 kundan so'ng tizimdan o'chiriladi.\n\n" +
    "/mening — hujjatni qayta olish\n/yangi — boshqa farzand uchun yangi anketa",
  editNotAvailable: "Rasmiylashtirilgan hujjatga o'zgartirish kiritish imkoni mavjud emas. Qayta rasmiylashtirish uchun /yangi buyrug'idan foydalaning.",
  editedPdf: "O'zgartirishlar saqlandi ✅ Yangilangan Ma'lumotnoma:",
  noPaid: "Sizda rasmiylashtirilgan Ma'lumotnoma mavjud emas. Boshlash uchun /start buyrug'ini yuboring.",
  newConfirm: "Yangi anketa boshlandi. Avvalgi Ma'lumotnomalar /mening bo'limida saqlanadi.",
  unfinishedExists: "Sizda yakunlanmagan anketa mavjud. Avval uni yakunlang yoki /bekor buyrug'i orqali bekor qiling.",
  cancelled: "Yakunlanmagan anketa bekor qilindi. Qayta boshlash uchun /start buyrug'ini yuboring.",
  nothingToCancel: "Bekor qilinadigan anketa mavjud emas.",
  help:
    "/start — anketani boshlash yoki davom ettirish\n" +
    "/mening — rasmiylashtirilgan Ma'lumotnomani qayta olish\n" +
    "/yangi — boshqa farzand uchun yangi anketa\n" +
    "/bekor — yakunlanmagan anketani bekor qilish",

  // Admin
  adminReceipt: (p, f, user) =>
    `🧾 Yangi chek #${p.id}\n` +
    `Anketa #${f.id}: ${f.name}\n` +
    `Foydalanuvchi: ${user}\n` +
    `Summa: ${p.amount} so'm`,
  btnApprove: "✅ Tasdiqlash",
  btnReject: "❌ Rad etish",
  adminAskReason: (id) => `Chek #${id} — rad etish sababini yozing (bekor qilish: /bekor):`,
  adminApproved: (id, by) => `✅ Chek #${id} tasdiqlandi (${by}).`,
  adminRejected: (id, reason) => `❌ Chek #${id} rad etildi. Sabab: ${reason}`,
  adminAlready: "Bu chek bo'yicha qaror allaqachon qabul qilingan.",
  adminCancelReason: "Rad etish bekor qilindi.",
  adminPdfCopy: (name) => `📄 Nusxa: ${name}`,
  adminStats: (s) =>
    `📊 <b>Statistika</b>\n\n` +
    `👥 <b>Foydalanuvchilar</b>\n` +
    `Jami botga kirganlar: ${s.users.total}\n` +
    `Bugun: ${s.users.today}\n` +
    `Oxirgi 7 kun: ${s.users.week}\n\n` +
    `📝 <b>Anketalar</b>\n` +
    `To'ldirilmoqda: ${s.filling}\n` +
    `To'lov kutilmoqda: ${s.payment}\n` +
    `Chek tekshiruvda: ${s.pending}\n` +
    `Admin tekshiruvida: ${s.checking}\n` +
    `Tayyor (to'langan): ${s.done}\n\n` +
    `💰 <b>Jami tushum:</b> ${s.sum} so'm`,
  adminHelp:
    "Admin buyruqlari:\n/stat — statistika\n/export — Excel ro'yxat\n/pdf 12 — 12-raqamli anketa PDF'i\n/tahrir 12 — 12-raqamli anketani tuzatish va qayta yuborish",
  // Admin → foydalanuvchi xabarlari
  btnWrite: "✉️ Foydalanuvchiga yozish",
  btnApproveAnyway: "✅ Baribir tasdiqlash",
  btnSend: "✅ Yuborish",
  btnCancel: "❌ Bekor",
  writeAsk: (name, formId) =>
    `✉️ Xabar kimga: ${name} (anketa #${formId})\n\nXabaringizni yozing (bekor qilish: /bekor):`,
  writeConfirm: (name, formId, text) =>
    `Kimga: ${name} (anketa #${formId})\nXabar: «${text}»\n\nYuboraymi?`,
  writeSent: (name, formId) => `✅ Yuborildi: ${name} (anketa #${formId})`,
  writeCancelled: "Xabar yuborilmadi, bekor qilindi.",
  writeExpired: "Bu xabar endi amal qilmaydi. Yozishni qaytadan boshlang.",
  writeFailed: "⚠️ Xabar yetib bormadi (foydalanuvchi botni to'xtatgan bo'lishi mumkin).",
  writeNeedText: "Iltimos, xabarni matn bilan yozing.",
  adminMessageToUser: (formId, text) =>
    `✉️ Administrator xabari (anketa #${formId}):\n\n${text}\n\nJavob berish uchun ushbu xabarga javob (reply) yuboring.`,
  userReplyToAdmin: (name, formId, who) => `💬 Javob: ${name} (anketa #${formId})\n${who}`,
  userReplySent: "Javobingiz administratorga yuborildi ✅",
  adminAlreadyPaid: "Bu anketa allaqachon tasdiqlangan.",
  // Admin tekshiruvi va tuzatish
  adminReviewTitle: (name, id) => `🔎 Tekshirish: ${name} (anketa #${id})`,
  adminDraftCaption: (name, id) => `📝 Qoralama: ${name} (#${id})\nXato bo'lsa — ✏️ Tahrirlash, hammasi to'g'ri bo'lsa — 📤 Yuborish.`,
  btnAdminEdit: "✏️ Tahrirlash",
  btnDeliver: "📤 Foydalanuvchiga yuborish",
  btnRedeliver: "📤 Qayta yuborish",
  adminEditChoose: (name, id) => `✏️ ${name} (anketa #${id}) — qaysi bandni tuzatasiz?`,
  adminEditAsk: (name, id, label, curOld, curNew, isNew) =>
    `✏️ ${name} (anketa #${id})\n${label}\n\n` +
    `Hozirgi (eski lotin): ${curOld}\n` +
    `Hozirgi (yangi alifbo): ${curNew}\n\n` +
    `Anketa yozuvi: ${isNew ? "yangi alifbo (avtomatik o'giriladi)" : "oddiy lotin"}\n\n` +
    `Yangi qiymatni yozing (bekor qilish: /bekor):`,
  btnToOld: "🔤 Eski lotinga o'tkazish",
  btnToNew: "🔤 Yangi alifboga o'tkazish",
  adminConverted: (isNew) => `✅ Hujjat ${isNew ? "yangi alifboga" : "eski lotin yozuviga"} o'tkazildi. Yangilangan qoralama:`,
  listTitle: (from, to, total) => `📂 Tayyor hujjatlar (${from}–${to} / ${total}). Tahrirlash uchun ismni bosing:`,
  searchTitle: (q, n) => `🔎 «${q}» bo'yicha topildi: ${n} ta. Tahrirlash uchun ismni bosing:`,
  listEmpty: "Hali tayyor hujjat yo'q.",
  searchEmpty: (q) => `«${q}» bo'yicha hech narsa topilmadi.`,
  btnPrev: "⬅️ Oldingi",
  btnNext: "Keyingi ➡️",
  adminEditAskPhoto: (name, id) => `✏️ ${name} (anketa #${id})\nYangi 3x4 rasmni yuboring (bekor qilish: /bekor):`,
  adminEditNeedPhoto: "Iltimos, rasm (foto) yuboring.",
  adminEditSaved: "✅ Saqlandi. Yangilangan qoralama:",
  adminEditCancelled: "Tahrirlash bekor qilindi.",
  adminDelivered: (name, id) => `✅ Yuborildi: ${name} (anketa #${id})`,
  adminDeliverFailed: (id) => `⚠️ Anketa #${id}: hujjat yuborilmadi.`,
  adminTahrirUsage: "Foydalanish: /tahrir — ro'yxat, /tahrir 12 — raqam bo'yicha, /tahrir Robiya — ism bo'yicha qidirish.",
  adminNoData: "Hali tayyor anketa yo'q.",
  adminNotFound: "Bunday tayyor anketa topilmadi.",
};
