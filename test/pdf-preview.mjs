import { readFileSync, writeFileSync } from "node:fs";
import { buildPdf } from "../src/pdf.js";
const fonts = { regular: readFileSync("fonts/LiberationSerif-Regular.ttf"), bold: readFileSync("fonts/LiberationSerif-Bold.ttf") };
const a = {
  familiya: "Aliyeva", ism: "Shahzoda", sharif: "Bahodirovna", tugilgan: "15.03.2018", millati: "o'zbek",
  otasi: "Aliyev Bahodir G'ayratovich", ota_ish: "Toshkent shahar 12-maktab, matematika o'qituvchisi",
  onasi: "Aliyeva Gulchehra Shavkatovna", ona_ish: "uy bekasi", farzand_soni: "3", nechanchi: "2",
  sharoit: "yaxshi", fanlar: "matematika, ona tili, rasm", togaraklar: "shaxmat, raqs",
  bosh_vaqt: "kitob o'qiydi, rasm chizadi, singlisi bilan o'ynaydi, velosiped haydaydi, onasiga uy ishlarida yordam beradi, bog'da gul ekadi va suv quyadi, mul'tfilm ko'radi",
  fel_atvor: "mehribon, tirishqoq", orzular: "shifokor bo'lish", telefon: "+998 90 123 45 67",
  manzil: "Navbahor MFY, Mustaqillik ko'chasi, 15-uy",
};
const photo = process.argv[2] === "nophoto" ? null : readFileSync("test/face.jpg");
writeFileSync("test/out/preview.pdf", await buildPdf(fonts, a, photo));
console.log("ok");
