// Avtomatik tozalash: bot bazasidan 30 kundan eski anketalar o'chiriladi.
// Telegram chatlaridagi xabar va PDF'lar o'chirilmaydi (bot ularga tegmaydi).
export const KEEP_DAYS = 30;

export async function cleanup(env) {
  const age = `-${Number(env.KEEP_DAYS || KEEP_DAYS)} days`;
  const forms = await env.DB.prepare("DELETE FROM forms WHERE created_at < datetime('now', ?)").bind(age).run();
  // To'lov yozuvlarida faqat summa va sana qoladi (statistika uchun)
  const pays = await env.DB.prepare(
    "UPDATE payments SET chat_id = 0, receipt_file_id = NULL, reason = NULL WHERE created_at < datetime('now', ?) AND chat_id <> 0",
  ).bind(age).run();
  await env.DB.prepare("DELETE FROM admin_state WHERE form_id IS NOT NULL AND form_id NOT IN (SELECT id FROM forms)").run();
  console.log(`tozalash: ${forms.meta.changes} anketa o'chirildi, ${pays.meta.changes} to'lov yozuvi tozalandi`);
  return { forms: forms.meta.changes, payments: pays.meta.changes };
}
