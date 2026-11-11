-- Botga kirganlar hisobi (statistika uchun). Faqat Telegram ID va sanalar, shaxsiy ma'lumot yo'q.
-- 30 kunlik tozalashda o'chirilmaydi.
CREATE TABLE IF NOT EXISTS users (
  chat_id    INTEGER PRIMARY KEY,
  first_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen  TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO users (chat_id, first_seen, last_seen)
  SELECT chat_id, MIN(created_at), MAX(updated_at) FROM forms GROUP BY chat_id;
