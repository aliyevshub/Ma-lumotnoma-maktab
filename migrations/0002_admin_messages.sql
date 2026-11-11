-- Admin holati: rad etish sababi (reject) yoki foydalanuvchiga xabar yozish (write)
ALTER TABLE admin_state ADD COLUMN mode TEXT NOT NULL DEFAULT 'reject';
ALTER TABLE admin_state ADD COLUMN form_id INTEGER;
ALTER TABLE admin_state ADD COLUMN draft TEXT;
