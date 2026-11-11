// Barça bot matnlari — yangi lotin alifbosida (Ş ş, Ç ç, Ö ö, Ğ ğ).
export const T = {
  // Start bosiştan oldin bot çatida körinadigan matn (setMyDescription)
  botDescription: (cls, price) =>
    `Assalomu alaykum! 👋\n` +
    `Bu bot ${cls} sinfi uçun Ma'lumotnoma tayyorlaydi.\n` +
    `Savollarga javob berasiz, 3x4 rasm yuborasiz, ${price} söm tölaysiz — tayyor PDF şu yerga keladi.\n` +
    `Boşlaş uçun «Start» tugmasini bosing.`,
  // Bot profilidagi qisqa yozuv (setMyShortDescription)
  botShortDescription: (cls) => `${cls} sinfi uçun Ma'lumotnoma — anketa töldiring, PDF oling.`,
  welcome: (cls, price) =>
    `Assalomu alaykum! Bu bot ${cls} sinfi uçun Ma'lumotnoma tayyorlaydi.\n\n` +
    `Savollarga birma-bir javob bering. Oxirida javoblarni tekşirib, ` +
    `${price} söm tölaysiz va tayyor PDF şu yerga keladi.\n\n` +
    `Boşladik!`,
  resume: "Anketani davom ettiramiz.",
  progress: (n, total) => `Savol ${n}/${total}`,
  askText: "Javobni yozib yuboring.",
  badDate: "Sana notögri. Kun.oy.yil körinişida yozing, masalan: 15.03.2018",
  badPhone: "Telefon raqami notögri. Masalan: +998 90 123 45 67",
  needText: "Iltimos, javobni matn bilan yozing.",
  needPhoto: "Iltimos, 3x4 suratni rasm (foto) qilib yuboring.",
  tooLong: (n) => `Javob juda uzun. ${n} belgidan qisqaroq yozing.`,
  reviewTitle: "Javoblaringizni tekşiring:",
  photoAttached: "biriktirildi ✅",
  btnEdit: "✏️ Tahrirlaş",
  btnConfirm: "✅ Hammasi tögri",
  btnBack: "⬅️ Orqaga",
  chooseEdit: "Qaysi javobni özgartirasiz?",
  editAsk: (label) => `Yangi javobni yuboring:\n\n${label}`,

  // HTML: karta raqami <code> içida — bosilsa nusxalanadi
  payInfo: (price, card, owner) =>
    `Anketa tayyor ✅\n\n` +
    `Ma'lumotnoma narxi: <b>${price} söm</b>.\n\n` +
    `Quyidagi kartaga ${price} söm ötkazing (Payme, Click yoki bank ilovasi orqali):\n\n` +
    `💳 <code>${card}</code>\n👤 ${owner}\n\n` +
    `👆 Karta raqamini nusxalaş uçun ustiga bosing yoki pastdagi tugmani bosing.\n\n` +
    `Tölovdan keyin çek rasmini (skrinşot) şu yerga yuboring.`,
  btnCopyCard: "📋 Karta raqamini nusxalaş",
  receiptReceived: "Çek qabul qilindi ✅ Admin tekşirgandan keyin PDF şu yerga keladi.",
  waitAdmin: "Çekingiz tekşirilmoqda. Iltimos, biroz kuting.",
  needReceipt: "Iltimos, tölov çekini rasm (foto yoki fayl) qilib yuboring.",
  approved: "Tölov tasdiqlandi ✅ Ma'lumotnomangiz:",
  rejected: (reason) =>
    `Tölov tasdiqlanmadi ❌\nSabab: ${reason}\n\nTögri çek rasmini qayta yuboring.`,
  pdfCaption: (name) => `Ma'lumotnoma — ${name}`,
  pdfError: "PDF tayyorlaşda xatolik böldi. Admin xabardor qilindi, tez orada yuboriladi.",

  menuDone:
    "Ma'lumotnomangiz tayyor. /mening — PDF'ni qayta oliş.\n/yangi — boşqa farzand uçun yangi anketa.",
  btnFreeEdit: "✏️ Tahrirlaş (1 marta bepul)",
  freeEditUsed: "Bepul tahrirlaş işlatilgan.",
  editedPdf: "Özgarişlar saqlandi ✅ Yangi Ma'lumotnoma:",
  noPaid: "Sizda hali tölangan Ma'lumotnoma yöq. Boşlaş uçun /start bosing.",
  newConfirm: "Yangi anketa boşlanadi. Oldingi Ma'lumotnomalaringiz /mening orqali qoladi.",
  unfinishedExists: "Sizda tugallanmagan anketa bor. Avval uni yakunlang yoki /bekor bosing.",
  cancelled: "Tugallanmagan anketa öçirildi. Yangidan boşlaş uçun /start bosing.",
  nothingToCancel: "Bekor qilinadigan anketa yöq.",
  help:
    "/start — anketani boşlaş yoki davom ettiriş\n" +
    "/mening — tölangan Ma'lumotnomani qayta oliş\n" +
    "/yangi — boşqa farzand uçun yangi anketa\n" +
    "/bekor — tugallanmagan anketani öçiriş",

  // Admin
  adminReceipt: (p, f, user) =>
    `🧾 Yangi çek #${p.id}\n` +
    `Anketa #${f.id}: ${f.name}\n` +
    `Foydalanuvçi: ${user}\n` +
    `Summa: ${p.amount} söm`,
  btnApprove: "✅ Tasdiqlaş",
  btnReject: "❌ Rad etiş",
  adminAskReason: (id) => `Çek #${id} — rad etiş sababini yozing (bekor qiliş: /bekor):`,
  adminApproved: (id, by) => `✅ Çek #${id} tasdiqlandi (${by}).`,
  adminRejected: (id, reason) => `❌ Çek #${id} rad etildi. Sabab: ${reason}`,
  adminAlready: "Bu çek böyiça qaror allaqaçon qabul qilingan.",
  adminCancelReason: "Rad etiş bekor qilindi.",
  adminPdfCopy: (name) => `📄 Nusxa: ${name}`,
  adminStats: (cls, s) =>
    `📊 ${cls} sinfi\n\n` +
    `Töldirilmoqda: ${s.filling}\n` +
    `Tölov kutilmoqda: ${s.payment}\n` +
    `Çek tekşiruvda: ${s.pending}\n` +
    `Tayyor (tölangan): ${s.done}\n\n` +
    `Jami tuşum: ${s.sum} söm`,
  adminHelp:
    "Admin buyruqlari:\n/holat — statistika\n/export — Excel röyxat\n/pdf 12 — 12-raqamli anketa PDF'i",
  // Admin → foydalanuvçi xabarlari
  btnWrite: "✉️ Foydalanuvçiga yoziş",
  btnApproveAnyway: "✅ Baribir tasdiqlaş",
  btnSend: "✅ Yuboriş",
  btnCancel: "❌ Bekor",
  writeAsk: (name, formId) =>
    `✉️ Xabar kimga: ${name} (anketa #${formId})\n\nXabaringizni yozing (bekor qiliş: /bekor):`,
  writeConfirm: (name, formId, text) =>
    `Kimga: ${name} (anketa #${formId})\nXabar: «${text}»\n\nYuboraymi?`,
  writeSent: (name, formId) => `✅ Yuborildi: ${name} (anketa #${formId})`,
  writeCancelled: "Xabar yuborilmadi, bekor qilindi.",
  writeExpired: "Bu xabar endi amal qilmaydi. Yozişni qaytadan boşlang.",
  writeFailed: "⚠️ Xabar yetib bormadi (foydalanuvçi botni töxtatgan bölişi mumkin).",
  writeNeedText: "Iltimos, xabarni matn bilan yozing.",
  adminMessageToUser: (formId, text) =>
    `✉️ Admin xabari (anketa #${formId}):\n\n${text}\n\nJavob yoziş uçun şu xabarga javob (reply) qiling.`,
  userReplyToAdmin: (name, formId, who) => `💬 Javob: ${name} (anketa #${formId})\n${who}`,
  userReplySent: "Javobingiz adminga yuborildi ✅",
  adminAlreadyPaid: "Bu anketa allaqaçon tasdiqlangan.",
  adminNoData: "Hali tayyor anketa yöq.",
  adminNotFound: "Bunday tayyor anketa topilmadi.",
};
