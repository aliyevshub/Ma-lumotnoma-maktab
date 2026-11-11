import { readFileSync, writeFileSync } from "node:fs";
import { buildPdf } from "../src/pdf.js";
const fonts = { regular: readFileSync("fonts/LiberationSerif-Regular.ttf"), bold: readFileSync("fonts/LiberationSerif-Bold.ttf") };
const a = {
  familiya: "Aliyeva", ism: "Şahzoda", sharif: "Bahodirovna", tugilgan: "15.03.2018", millati: "özbek",
  otasi: "Aliyev Bahodir Ğayratoviç", ota_ish: "Toşkent şahar 12-maktab, matematika öqituvçisi",
  onasi: "Aliyeva Gulçehra Şavkatovna", ona_ish: "uy bekasi", farzand_soni: "3", nechanchi: "2",
  sharoit: "yaxşi", fanlar: "matematika, ona tili, rasm", togaraklar: "şaxmat, raqs",
  bosh_vaqt: "kitob öqiydi, rasm çizadi, singlisi bilan öynaydi, velosiped haydaydi, onasiga uy işlarida yordam beradi, bog'da gul ekadi va suv quyadi, mul'tfilm köradi",
  fel_atvor: "mehribon, tirişqoq", orzular: "şifokor böliş", telefon: "+998 90 123 45 67",
  manzil: "Navbahor MFY, Mustaqillik köçasi, 15-uy",
};
const photo = process.argv[2] === "nophoto" ? null : readFileSync("test/face.jpg");
writeFileSync("test/out/preview.pdf", await buildPdf(fonts, a, photo));
console.log("ok");
