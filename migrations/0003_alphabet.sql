-- Anketa yozuvi: 'latin' (o', g', sh, ch) yoki 'new' (ö, ğ, ş, ç). NULL — eski anketalar (latin)
ALTER TABLE forms ADD COLUMN alphabet TEXT;
