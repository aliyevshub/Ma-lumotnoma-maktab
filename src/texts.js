// Barcha bot matnlari — oddiy lotin yozuvida (sh, ch, o', g').
export const T = {
  // Start bosishdan oldin bot chatida ko'rinadigan matn (setMyDescription)
  botDescription: (cls, price) =>
    `Assalomu alaykum! 👋\n` +
    `Bu bot Ma'lumotnoma tayyorlaydi.\n` +
    `Savollarga javob berasiz, 3x4 rasm yuborasiz, ${price} so'm to'laysiz — tayyor PDF shu yerga keladi.\n` +
    `Boshlash uchun «Start» tugmasini bosing.`,
  // Bot profilidagi qisqa yozuv (setMyShortDescription)
  botShortDescription: () => `Ma'lumotnoma — anketa to'ldiring, PDF oling.`,
  welcome: (cls, price) =>
    `Assalomu alaykum! Bu bot Ma'lumotnoma tayyorlaydi.\n\n` +
    `Savollarga birma-bir javob bering. Oxirida javoblarni tekshirib, ` +
    `${price} so'm to'laysiz va tayyor PDF shu yerga keladi.\n\n` +
    `Boshladik!`,
  resume: "Anketani davom ettiramiz.",
  progress: (n, total) => `Savol ${n}/${total}`,
  askText: "Javobni yozib yuboring.",
  badDate: "Sana noto'g'ri. Kun.oy.yil ko'rinishida yozing, masalan: 15.03.2018",
  badPhone: "Telefon raqami noto'g'ri. Masalan: +998 90 123 45 67",
  needText: "Iltimos, javobni matn bilan yozing.",
  needPhoto: "Iltimos, 3x4 suratni rasm (foto) qilib yuboring.",
  tooLong: (n) => `Javob juda uzun. ${n} belgidan qisqaroq yozing.`,
  reviewTitle: "Javoblaringizni tekshiring:",
  checking: "⏳ Javoblar tekshirilmoqda...",
  autoFixed: "✍️ Imlo xatolari avtomatik tuzatildi. Noto'g'ri bo'lsa, ✏️ Tahrirlash orqali o'zgartiring.",
  photoAttached: "biriktirildi ✅",
  btnEdit: "✏️ Tahrirlash",
  btnConfirm: "✅ Hammasi to'g'ri",
  btnBack: "⬅️ Orqaga",
  chooseEdit: "Qaysi javobni o'zgartirasiz?",
  editAsk: (label) => `Yangi javobni yuboring:\n\n${label}`,

  // HTML: karta raqami <code> ichida — bosilsa nusxalanadi
  payInfo: (price, card, owner) =>
    `Anketa tayyor ✅\n\n` +
    `Ma'lumotnoma narxi: <b>${price} so'm</b>.\n\n` +
    `Quyidagi kartaga ${price} so'm o'tkazing (Payme, Click yoki bank ilovasi orqali):\n\n` +
    `💳 <code>${card}</code>\n👤 ${owner}\n\n` +
    `👆 Karta raqamini nusxalash uchun ustiga bosing yoki pastdagi tugmani bosing.\n\n` +
    `To'lovdan keyin chek rasmini (skrinshot) shu yerga yuboring.`,
  btnCopyCard: "📋 Karta raqamini nusxalash",
  receiptReceived: "Chek qabul qilindi ✅ Admin tekshirgandan keyin PDF shu yerga keladi.",
  waitAdmin: "Chekingiz tekshirilmoqda. Iltimos, biroz kuting.",
  needReceipt: "Iltimos, to'lov chekini rasm (foto yoki fayl) qilib yuboring.",
  approved: "To'lov tasdiqlandi ✅ Ma'lumotnomangiz:",
  rejected: (reason) =>
    `To'lov tasdiqlanmadi ❌\nSabab: ${reason}\n\nTo'g'ri chek rasmini qayta yuboring.`,
  pdfCaption: (name) => `Ma'lumotnoma — ${name}`,
  pdfError: "PDF tayyorlashda xatolik bo'ldi. Admin xabardor qilindi, tez orada yuboriladi.",

  menuDone:
    "Ma'lumotnomangiz tayyor. /mening — PDF'ni qayta olish.\n/yangi — boshqa farzand uchun yangi anketa.",
  btnFreeEdit: "✏️ Tahrirlash (1 marta bepul)",
  freeEditUsed: "Bepul tahrirlash ishlatilgan.",
  editedPdf: "O'zgarishlar saqlandi ✅ Yangi Ma'lumotnoma:",
  noPaid: "Sizda hali to'langan Ma'lumotnoma yo'q. Boshlash uchun /start bosing.",
  newConfirm: "Yangi anketa boshlanadi. Oldingi Ma'lumotnomalaringiz /mening orqali qoladi.",
  unfinishedExists: "Sizda tugallanmagan anketa bor. Avval uni yakunlang yoki /bekor bosing.",
  cancelled: "Tugallanmagan anketa o'chirildi. Yangidan boshlash uchun /start bosing.",
  nothingToCancel: "Bekor qilinadigan anketa yo'q.",
  help:
    "/start — anketani boshlash yoki davom ettirish\n" +
    "/mening — to'langan Ma'lumotnomani qayta olish\n" +
    "/yangi — boshqa farzand uchun yangi anketa\n" +
    "/bekor — tugallanmagan anketani o'chirish",

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
  adminStats: (cls, s) =>
    `📊 ${cls} sinfi\n\n` +
    `To'ldirilmoqda: ${s.filling}\n` +
    `To'lov kutilmoqda: ${s.payment}\n` +
    `Chek tekshiruvda: ${s.pending}\n` +
    `Tayyor (to'langan): ${s.done}\n\n` +
    `Jami tushum: ${s.sum} so'm`,
  adminHelp:
    "Admin buyruqlari:\n/holat — statistika\n/export — Excel ro'yxat\n/pdf 12 — 12-raqamli anketa PDF'i",
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
    `✉️ Admin xabari (anketa #${formId}):\n\n${text}\n\nJavob yozish uchun shu xabarga javob (reply) qiling.`,
  userReplyToAdmin: (name, formId, who) => `💬 Javob: ${name} (anketa #${formId})\n${who}`,
  userReplySent: "Javobingiz adminga yuborildi ✅",
  adminAlreadyPaid: "Bu anketa allaqachon tasdiqlangan.",
  adminNoData: "Hali tayyor anketa yo'q.",
  adminNotFound: "Bunday tayyor anketa topilmadi.",
};
