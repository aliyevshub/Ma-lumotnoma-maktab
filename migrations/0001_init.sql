-- Foydalanuvchilar va ularning joriy anketasi
CREATE TABLE IF NOT EXISTS forms (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id       INTEGER NOT NULL,
  username      TEXT,
  status        TEXT NOT NULL DEFAULT 'filling', -- filling | review | payment | pending | done
  step          INTEGER NOT NULL DEFAULT 0,      -- to'ldirilayotgan savol indeksi
  edit_key      TEXT,                            -- tahrirlanayotgan savol kaliti
  answers       TEXT NOT NULL DEFAULT '{}',      -- JSON
  photo_file_id TEXT,
  pdf_file_id   TEXT,                            -- Telegram'dagi tayyor PDF
  paid          INTEGER NOT NULL DEFAULT 0,
  free_edit_used INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_forms_chat ON forms(chat_id, id);

-- To'lovlar (provider: manual | payme | stars ...)
CREATE TABLE IF NOT EXISTS payments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  form_id         INTEGER NOT NULL,
  chat_id         INTEGER NOT NULL,
  amount          INTEGER NOT NULL,
  provider        TEXT NOT NULL DEFAULT 'manual',
  receipt_file_id TEXT,
  external_id     TEXT,                          -- Payme/Stars tranzaksiya id
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  reason          TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  decided_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_payments_form ON payments(form_id);

-- Admin rad etish sababini yozayotgan payt
CREATE TABLE IF NOT EXISTS admin_state (
  admin_id   INTEGER PRIMARY KEY,
  payment_id INTEGER NOT NULL,
  message_id INTEGER                 -- adminga kelgan chek xabari
);
