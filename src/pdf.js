// Qog'oz Ma'lumotnomaga o'xshash PDF: ikki qavat ko'k ramka, sarlavha,
// o'ng yuqorida 3x4 rasm, chiziqlar ustida javoblar.
import {
  PDFDocument, rgb, pushGraphicsState, popGraphicsState, rectangle, clip, endPath,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const W = 595.28, H = 841.89;
const BLUE = rgb(0.13, 0.25, 0.62);
const INK = rgb(0, 0, 0);            // javoblar rangi — yorliqlar bilan bir xil (qora)
const BLACK = rgb(0, 0, 0);
const LINE = rgb(0.25, 0.25, 0.25);

const LEFT = 62, RIGHT = 535;          // chiziqlar chegarasi
const PHOTO = { x: 445, top: 70, w: 85, h: 113 }; // 3x4 sm ≈ 85x113 pt
const TOP_ROWS = [                      // rasm yonidagi qisqa chiziqlar
  { key: "familiya", label: "Familiyasi", top: 135 },
  { key: "ism", label: "Ismi", top: 162 },
  { key: "sharif", label: "Sharifi", top: 189 },
];
const TOP_RIGHT = 330;

// Asosiy qatorlar (qog'ozdagi tartib). key: null — bo'sh davom chizig'i
const ROWS = [
  ["tugilgan", "Tug'ilgan kun, oy, yil"],
  ["millati", "Millati"],
  ["otasi", "Otasi"],
  ["ota_ish", "Ish joyi, lavozimi"],
  ["onasi", "Onasi"],
  ["ona_ish", "Ish joyi, lavozimi"],
  ["farzand_soni", "Oilada nechta farzand"],
  ["nechanchi", "Oilada nechanchi farzand"],
  ["sharoit", "Oilaviy sharoiti"],
  ["fanlar", "Qiziqqan fanlari"],
  ["togaraklar", "Qanday to'garaklarga qatnashadi"],
  ["bosh_vaqt", "Bo'sh vaqtida nimalar bilan shug'ullanadi", { cont: true }],
  [null, ""],
  ["fel_atvor", "Fe'l atvor xususiyati"],
  ["orzular", "Kelajakdagi orzulari"],
  ["telefon", "Telefon raqami"],
  ["manzil", "Yashash manzili (MFY, ko'cha, uy raqami)"],
  ["qaydlar", "Qaydlar uchun"],          // har doim bo'sh
  [null, ""],
  [null, ""],
  [null, ""],
];
const ROWS_TOP = 245, ROW_STEP = 26;

const LABEL_SIZE = 10.5, ANSWER_SIZE = 10.5, MIN_SIZE = 8;

// Matnni berilgan kenglikka sıg'dirish: avval shriftni kichraytirish,
// sıg'masa — ikki qatorga bo'lib, ikkinchisini qaytarish
function fit(font, text, width) {
  for (let s = ANSWER_SIZE; s >= MIN_SIZE; s -= 0.5) {
    if (font.widthOfTextAtSize(text, s) <= width) return { size: s, first: text, rest: "" };
  }
  const words = text.split(/\s+/);
  let first = "";
  while (words.length) {
    const next = first ? `${first} ${words[0]}` : words[0];
    if (font.widthOfTextAtSize(next, MIN_SIZE) > width) break;
    first = next;
    words.shift();
  }
  if (!first) { // juda uzun bitta so'z
    let i = text.length;
    while (i > 1 && font.widthOfTextAtSize(text.slice(0, i), MIN_SIZE) > width) i--;
    return { size: MIN_SIZE, first: text.slice(0, i), rest: text.slice(i) };
  }
  return { size: MIN_SIZE, first, rest: words.join(" ") };
}

function truncate(font, text, size, width) {
  if (font.widthOfTextAtSize(text, size) <= width) return text;
  let t = text;
  while (t.length > 1 && font.widthOfTextAtSize(t + "…", size) > width) t = t.slice(0, -1);
  return t + "…";
}

// Chiziq ustiga javob yozish. Sıg'masa: davom chizig'i bo'lsa unga,
// aks holda shu chiziq ustida ikki qator qilib.
function drawAnswer(page, font, text, x, y, right, contY) {
  if (!text) return;
  const width = right - x - 2;
  const r = fit(font, text, width);
  if (!r.rest) {
    page.drawText(r.first, { x, y: y + 2.5, size: r.size, font, color: INK });
    return;
  }
  if (contY != null) {
    // normal o'lchamda so'zma-so'z bo'lib, qolganini davom chizig'iga
    const words = text.split(/\s+/);
    let first = "";
    while (words.length) {
      const next = first ? `${first} ${words[0]}` : words[0];
      if (font.widthOfTextAtSize(next, ANSWER_SIZE) > width) break;
      first = next;
      words.shift();
    }
    if (first) r.first = first, r.rest = words.join(" "), r.size = ANSWER_SIZE;
    page.drawText(r.first, { x, y: y + 2.5, size: r.size, font, color: INK });
    const w2 = RIGHT - LEFT - 2;
    const r2 = fit(font, r.rest, w2);
    page.drawText(truncate(font, r2.rest ? `${r2.first} ${r2.rest}` : r2.first, r2.size, w2),
      { x: LEFT, y: contY + 2.5, size: r2.size, font, color: INK });
    return;
  }
  page.drawText(r.first, { x, y: y + 11, size: MIN_SIZE, font, color: INK });
  page.drawText(truncate(font, r.rest, MIN_SIZE, width), { x, y: y + 2.5, size: MIN_SIZE, font, color: INK });
}

function isPng(b) { return b && b[0] === 0x89 && b[1] === 0x50; }
function isJpg(b) { return b && b[0] === 0xff && b[1] === 0xd8; }

/**
 * @param {{regular: ArrayBuffer|Uint8Array, bold: ArrayBuffer|Uint8Array}} fonts
 * @param {Record<string,string>} answers
 * @param {Uint8Array|null} photo  JPEG/PNG
 */
export async function buildPdf(fonts, answers, photo) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Ma'lumotnoma — ${answers.familiya || ""} ${answers.ism || ""}`.trim());
  doc.setCreator("Ma'lumotnoma bot");
  const font = await doc.embedFont(fonts.regular, { subset: true });
  const bold = await doc.embedFont(fonts.bold, { subset: true });
  const page = doc.addPage([W, H]);
  const Y = (top) => H - top;

  // Ramka: tashqi qalin, ichki ingichka
  page.drawRectangle({ x: 26, y: 26, width: W - 52, height: H - 52, borderColor: BLUE, borderWidth: 2.4 });
  page.drawRectangle({ x: 32, y: 32, width: W - 64, height: H - 64, borderColor: BLUE, borderWidth: 0.7 });

  // Sarlavha
  const title = "MA`LUMOTNOMA";
  const tSize = 14;
  const tW = bold.widthOfTextAtSize(title, tSize);
  page.drawText(title, { x: (LEFT + PHOTO.x) / 2 - tW / 2, y: Y(92), size: tSize, font: bold, color: BLACK });

  // 3x4 rasm joyi
  const py = Y(PHOTO.top + PHOTO.h);
  let placed = false;
  if (photo && (isJpg(photo) || isPng(photo))) {
    try {
      const img = isPng(photo) ? await doc.embedPng(photo) : await doc.embedJpg(photo);
      // "cover": ramkani to'liq qoplaydi, ortiqchasi qirqiladi
      const k = Math.max(PHOTO.w / img.width, PHOTO.h / img.height);
      const iw = img.width * k, ih = img.height * k;
      page.pushOperators(pushGraphicsState(), rectangle(PHOTO.x, py, PHOTO.w, PHOTO.h), clip(), endPath());
      page.drawImage(img, { x: PHOTO.x + (PHOTO.w - iw) / 2, y: py + (PHOTO.h - ih) / 2, width: iw, height: ih });
      page.pushOperators(popGraphicsState());
      placed = true;
    } catch (e) {
      console.log("rasm qo'shilmadi:", e?.message);
    }
  }
  page.drawRectangle({ x: PHOTO.x, y: py, width: PHOTO.w, height: PHOTO.h, borderColor: BLACK, borderWidth: 1.2 });
  if (!placed) {
    const s = 7, t = "JOY 3x4";
    page.drawText(t, { x: PHOTO.x + PHOTO.w / 2 - font.widthOfTextAtSize(t, s) / 2, y: py + 6, size: s, font, color: BLACK });
  }

  // Familiyasi / Ismi / Sharifi
  for (const r of TOP_ROWS) {
    const y = Y(r.top);
    page.drawText(r.label, { x: LEFT + 4, y: y + 2.5, size: LABEL_SIZE, font, color: BLACK });
    const lx = LEFT + 4 + font.widthOfTextAtSize(r.label, LABEL_SIZE) + 4;
    page.drawLine({ start: { x: lx, y }, end: { x: TOP_RIGHT, y }, thickness: 0.6, color: LINE });
    drawAnswer(page, font, answers[r.key], lx + 4, y, TOP_RIGHT, null);
  }

  // Asosiy qatorlar
  ROWS.forEach(([key, label, opt], i) => {
    const y = Y(ROWS_TOP + i * ROW_STEP);
    let lx = LEFT;
    if (label) {
      page.drawText(label, { x: LEFT, y: y + 2.5, size: LABEL_SIZE, font, color: BLACK });
      lx = LEFT + font.widthOfTextAtSize(label, LABEL_SIZE) + 4;
    }
    page.drawLine({ start: { x: lx, y }, end: { x: RIGHT, y }, thickness: 0.6, color: LINE });
    if (key && key !== "qaydlar") {
      const contY = opt?.cont ? Y(ROWS_TOP + (i + 1) * ROW_STEP) : null;
      drawAnswer(page, font, answers[key], lx + 4, y, RIGHT, contY);
    }
  });

  return doc.save();
}
