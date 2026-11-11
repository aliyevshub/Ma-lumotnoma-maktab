// D1 bilan ishlash uchun yordamchi funksiyalar
export async function currentForm(env, chatId) {
  const row = await env.DB.prepare(// faol (tugallanmagan) anketa birinchi, keyin eng oxirgisi
    "SELECT * FROM forms WHERE chat_id = ? ORDER BY (status <> 'done') DESC, updated_at DESC, id DESC LIMIT 1")
    .bind(chatId).first();
  return row ? hydrate(row) : null;
}

export async function formById(env, id) {
  const row = await env.DB.prepare("SELECT * FROM forms WHERE id = ?").bind(id).first();
  return row ? hydrate(row) : null;
}

function hydrate(row) {
  try { row.answers = JSON.parse(row.answers || "{}"); } catch { row.answers = {}; }
  return row;
}

export async function createForm(env, chatId, username) {
  const r = await env.DB.prepare("INSERT INTO forms (chat_id, username) VALUES (?, ?) RETURNING *")
    .bind(chatId, username || null).first();
  return hydrate(r);
}

// Faqat berilgan maydonlarni yangilash
export async function saveForm(env, form, fields) {
  const cols = Object.keys(fields);
  const vals = cols.map((c) => (c === "answers" ? JSON.stringify(fields[c]) : fields[c]));
  await env.DB.prepare(
    `UPDATE forms SET ${cols.map((c) => `${c} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`,
  ).bind(...vals, form.id).run();
  Object.assign(form, fields);
  return form;
}

export async function deleteForm(env, id) {
  await env.DB.prepare("DELETE FROM forms WHERE id = ?").bind(id).run();
}

export async function paidForms(env, chatId) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM forms WHERE chat_id = ? AND paid = 1 ORDER BY id",
  ).bind(chatId).all();
  return results.map(hydrate);
}

export async function allPaidForms(env) {
  const { results } = await env.DB.prepare("SELECT * FROM forms WHERE paid = 1 ORDER BY id").all();
  return results.map(hydrate);
}

export function displayName(form) {
  const a = form.answers || {};
  return [a.familiya, a.ism].filter(Boolean).join(" ") || `Anketa #${form.id}`;
}
