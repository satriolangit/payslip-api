const express = require("express");
const puppeteer = require("puppeteer");
const appConfig = require("config");
const path = require("path");
const fs = require("fs");
const config = appConfig.get("ideabox");
const queryPdf = require("../queries/ideaboxPdfQuery");

const router = express.Router();

const printPdf = async ({ url, filepath }) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  const pdf = await page.pdf({ format: "A4", path: filepath });

  await browser.close();
};

router.get("/umum", async (req, res) => {
  const assets_url = config.get("pdf_assets_url");
  const pdf_path = path.join(__dirname, "public/report");
  const base_url = appConfig.get("base_url");

  //const ideabox = await queryPdf.getData(ideaboxId);

  const data = {
    logo: `${assets_url}/logo.png`,
    logoMaster: `${assets_url}/logo-master.png`,
    logo3Tahun: `${assets_url}/3tahun.png`,
    nama: "AULIA RAHMAWATI",
    nik: "3361",
    departemen: "GA",
    areaKaizen: "Pos Security",
    tanggal: "23 March 2022",
    tema: "Safety and Health",
    ideaNumber: "2022-03-0008",
    before: "Belum induction safety untuk tamu",
    beforeImage: `${base_url}/public/ideabox/beforeImage.jpg`,
    after: "Dibuatkan safety induction untuk tamu",
    afterImage: `${base_url}/public/ideabox/afterImage.PNG`,
    pelaksanaanIdeasheet: false,
    impacts: [
      {
        id: 1,
        checked: true,
        text: "Internal Control, Efisiensi Waktu Kerja dan Cost Down",
      },
      {
        id: 2,
        checked: true,
        text: "Efisiensi Waktu (Penyederhanaan proses kerja)",
      },
      {
        id: 3,
        checked: false,
        text: "Efisiensi Biaya (Cost Down) (General / Administrative / Labour Cost / FOH)",
      },
      {
        id: 4,
        checked: false,
        text: "Internal Control namun tidak ada efisiensi kerja",
      },
      { id: 5, checked: true, text: "Tidak Ada." },
    ],
    nilaiKaizen: "Satu juta sembilan ratus ribu rupiah",
    comments: [
      {
        createdBy: "Athena Wales",
        createdAt: "2022-01-01",
        comment: "comment 1 januari",
      },
      {
        createdBy: "Shea Lucifer",
        createdAt: "2022-01-01",
        comment: "comment 2 januari",
      },
      {
        createdBy: "Catherine Asmodeus",
        createdAt: "2022-01-01",
        comment: "comment 3 januari",
      },
    ],
    diterimaOleh: "Catherine Asmodeus",
    disetujuiOleh: "Shea Lucifer",
    diperiksaOleh: "Athena Wales",
    dibuatOleh: "AULIA RAHMAWATI",
  };

  res.render("ideasheet_umum", { data: data });
});

router.get("/kyt", async (req, res) => {
  const data = {
    logo: "http://localhost:3001/public/tmpl_images/logo.png",
    logoMaster: "http://localhost:3001/public/tmpl_images/logo-master.png",
    logo3Tahun: "http://localhost:3001/public/tmpl_images/3tahun.png",
    nama: "AULIA RAHMAWATI",
    nik: "3361",
    departemen: "GA",
    areaKaizen: "Pos Security",
    tanggal: "23 March 2022",
    tema: "Safety and Health",
    ideaNumber: "2022-03-0008",
    before: "Belum induction safety untuk tamu",
    beforeImage: "http://localhost:3001/public/tmpl_images/beforeImage.jpg",
    beforeKapan: "kapan",
    beforeDimana: "dimana",
    beforeSiapa: "siapa",
    beforeApa: "apa",
    beforeBagaimana: "bagaimana",
    beforeApaYangTerjadi: "apa yang terjadi",
    beforeSituasi: "situasi",
    after: "Dibuatkan safety induction untuk tamu",
    afterImage: "http://localhost:3001/public/tmpl_images/afterImage.PNG",
    rank: 3,
    pelaksanaanIdeasheet: false,
    impacts: [
      {
        id: 1,
        checked: true,
        text: "Internal Control, Efisiensi Waktu Kerja dan Cost Down",
      },
      {
        id: 2,
        checked: true,
        text: "Efisiensi Waktu (Penyederhanaan proses kerja)",
      },
      {
        id: 3,
        checked: false,
        text: "Efisiensi Biaya (Cost Down) (General / Administrative / Labour Cost / FOH)",
      },
      {
        id: 4,
        checked: false,
        text: "Internal Control namun tidak ada efisiensi kerja",
      },
      { id: 5, checked: true, text: "Tidak Ada." },
    ],
    nilaiKaizen: "Satu juta sembilan ratus ribu rupiah",
    comments: [
      {
        createdBy: "Athena Wales",
        createdAt: "2022-01-01",
        comment: "comment 1 januari",
      },
      {
        createdBy: "Shea Lucifer",
        createdAt: "2022-01-01",
        comment: "comment 2 januari",
      },
      {
        createdBy: "Catherine Asmodeus",
        createdAt: "2022-01-01",
        comment: "comment 3 januari",
      },
    ],
    diterimaOleh: "Catherine Asmodeus",
    disetujuiOleh: "Shea Lucifer",
    diperiksaOleh: "Athena Wales",
    dibuatOleh: "AULIA RAHMAWATI",
  };

  res.render("ideasheet_kyt", { data: data });
});

router.get("/print/umum", async (req, res) => {
  const opts = {
    url: "http://localhost:3001/api/report/umum",
    filepath: path.join(__dirname, "public/report/ideasheet-umum.pdf"),
  };
  await printPdf(opts);
  res.send("print pdf");
});

router.get("/print/kyt", async (req, res) => {
  const opts = {
    url: "http://localhost:3001/api/report/kyt",
    filepath: path.join(__dirname, "public/report/ideasheet-kyt.pdf"),
  };
  await printPdf(opts);
  res.send("print pdf");
});

router.post("/", async (req, res) => {
  try {
  } catch (error) {}
});

module.exports = router;
