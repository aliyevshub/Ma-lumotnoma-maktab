// 3x4 rasmni avtomatik qirqish: yuzni topib, standart ko'rinishga keltirish.
// Yuz topilmasa — null (rasm avvalgidek markazdan joylashtiriladi).
import jpeg from "jpeg-js";
import pico from "./vendor/pico.js";

// Kaskad fayli (src/vendor/facefinder.bin) tashqaridan beriladi: Worker'da import, testda fs
let classify = null, loadedFrom = null;
function classifier(cascadeBytes) {
  if (!classify || loadedFrom !== cascadeBytes) {
    classify = pico.unpack_cascade(new Int8Array(cascadeBytes));
    loadedFrom = cascadeBytes;
  }
  return classify;
}

const DETECT_SIZE = 360; // aniqlash uchun kichraytirilgan o'lcham (tezlik uchun)

// Kulrang, kichraytirilgan rasm
function toGray(img) {
  const k = Math.min(1, DETECT_SIZE / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * k));
  const h = Math.max(1, Math.round(img.height * k));
  const out = new Uint8Array(w * h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    const sy = Math.min(img.height - 1, Math.floor(y / k));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(img.width - 1, Math.floor(x / k));
      const i = (sy * img.width + sx) * 4;
      out[y * w + x] = (2 * d[i] + 7 * d[i + 1] + d[i + 2]) / 10;
    }
  }
  return { pixels: out, nrows: h, ncols: w, ldim: w, k };
}

// Eng ishonchli yuz: { cx, cy, size } — asl rasm piksellarida
export function detectFace(jpegBytes, cascadeBytes) {
  const img = jpeg.decode(jpegBytes, { useTArray: true, maxResolutionInMP: 30, maxMemoryUsageInMB: 256 });
  const g = toGray(img);
  const minSide = Math.min(g.nrows, g.ncols);
  const params = { shiftfactor: 0.08, scalefactor: 1.1, minsize: Math.max(20, minSide * 0.15), maxsize: minSide };
  let dets = pico.run_cascade(g, classifier(cascadeBytes), params);
  dets = pico.cluster_detections(dets, 0.2);
  const good = dets.filter((d) => d[3] > 5).sort((a, b) => b[3] - a[3]);
  if (!good.length) return null;
  const [r, c, s] = good[0];
  return { cx: c / g.k, cy: r / g.k, size: s / g.k, width: img.width, height: img.height };
}

// Standart 3x4 ko'rinish: yuz kengligi kadr kengligining FACE_W qismi,
// yuz markazi kadr balandligining FACE_Y nuqtasida.
const FACE_W = 0.63; // namuna (2-rasm) bo'yicha o'lchangan
const FACE_Y = 0.38;
const ASPECT = 3 / 4; // kenglik / balandlik

// Qirqish to'rtburchagi — rasm o'lchamiga nisbatan ulushlarda (0..1), yuqori-chap burchakdan.
// Ulushlarda bo'lgani uchun kichik nusxada topilgan natija katta rasmga ham to'g'ri keladi.
export function cropFor(face) {
  if (!face) return null;
  let w = face.size / FACE_W;
  let h = w / ASPECT;
  // rasm chegarasidan chiqib ketmasin: kerak bo'lsa kadrni kichraytirmasdan siljitamiz,
  // sig'masa — rasmga sig'adigan eng katta kadr
  if (w > face.width) { w = face.width; h = w / ASPECT; }
  if (h > face.height) { h = face.height; w = h * ASPECT; }
  let x = face.cx - w / 2;
  let y = face.cy - h * FACE_Y;
  x = Math.min(Math.max(0, x), face.width - w);
  y = Math.min(Math.max(0, y), face.height - h);
  return { x: x / face.width, y: y / face.height, w: w / face.width, h: h / face.height };
}

// Rasm baytlaridan qirqish (xato bo'lsa — null, PDF baribir yasaladi)
export function autoCrop(bytes, cascadeBytes) {
  try {
    if (!cascadeBytes || !bytes || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null; // faqat JPEG
    return cropFor(detectFace(bytes, cascadeBytes));
  } catch (e) {
    console.log("yuz aniqlash xatosi:", e?.message || e);
    return null;
  }
}
