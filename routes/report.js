const express = require("express");
const puppeteer = require("puppeteer");
const appConfig = require("config");
const path = require("path");
const fs = require("fs");
const config = appConfig.get("ideabox");
const queryPdf = require("../queries/ideaboxPdfQuery");

const router = express.Router();

const printPdf = async ({ url, filepath }) => {
  console.log(filepath);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  const pdf = await page.pdf({
    format: "A4",
    path: filepath,
  });

  await browser.close();
};

router.get("/umum/:id", async (req, res) => {
  const assets_url = config.get("pdf_assets_url");
  const pdf_path = path.join(__dirname, "public/report");
  const base_url = appConfig.get("base_url");
  const ideaboxId = req.params.id;
  const ideabox = await queryPdf.getData(ideaboxId);

  const { master, detail, comment, impact } = ideabox;

  const data = {
    logo: `${assets_url}/logo.png`,
    logoMaster: `${assets_url}/logo-master.png`,
    logo3Tahun: `${assets_url}/3tahun.png`,
    nama: master.submitterName,
    nik: master.submittedBy,
    departemen: master.departmentName,
    areaKaizen: master.kaizenArea,
    tanggal: master.submittedAt,
    tema: master.tema,
    ideaNumber: master.ideaNumber,
    before: detail.beforeSummary,
    beforeImage: `${base_url}/public/ideabox/${detail.beforeImage}`,
    after: detail.afterSummary,
    afterImage: `${base_url}/public/ideabox/${detailAfterImage}`,
    pelaksanaanIdeasheet: master.isIdeasheet,
    impacts: impact,
    nilaiKaizen: master.kaizenAmount,
    comments: comment,
    diterimaOleh: master.receiverName,
    disetujuiOleh: master.approverName,
    diperiksaOleh: master.reviewerName,
    dibuatOleh: master.submitterName,
  };

  res.render("ideasheet_umum", { data: data });
});

router.get("/kyt", async (req, res) => {
  const assets_url = config.get("pdf_assets_url");
  const pdf_path = path.join(__dirname, "public/report");
  const base_url = appConfig.get("base_url");
  const ideaboxId = req.params.id;
  const ideabox = await queryPdf.getData(ideaboxId);

  const { master, detail, comment, impact } = ideabox;

  const data = {
    logo: `${assets_url}/logo.png`,
    logoMaster: `${assets_url}/logo-master.png`,
    logo3Tahun: `${assets_url}/3tahun.png`,
    nama: master.submitterName,
    nik: master.submittedBy,
    departemen: master.departmentName,
    areaKaizen: master.kaizenArea,
    tanggal: master.submittedAt,
    tema: master.tema,
    ideaNumber: master.ideaNumber,
    before: detail.beforeSummary,
    beforeImage: `${base_url}/public/ideabox/${detail.beforeImage}`,
    beforeKapan: detail.beforeKapan,
    beforeDimana: detail.beforeDimana,
    beforeSiapa: detail.beforeSiapa,
    beforeApa: detail.beforeApa,
    beforeBagaimana: detail.beforeBagaimana,
    beforeApaYangTerjadi: detail.beforeIncident,
    beforeSituasi: detail.beforeSituation,
    after: master.afterSummary,
    afterImage: `${base_url}/public/ideabox/${detailAfterImage}`,
    rank: detail.afterRank,
    pelaksanaanIdeasheet: master.isIdeasheet,
    impacts: impact,
    nilaiKaizen: master.kaizenAmount,
    comments: comment,
    diterimaOleh: master.receiverName,
    disetujuiOleh: master.approverName,
    diperiksaOleh: master.reviewerName,
    dibuatOleh: master.submitterName,
  };

  res.render("ideasheet_qkyt", { data: data });
});

router.get("/print/umum", async (req, res) => {
  await printPdf({
    url: "http://localhost:3001/api/report/umum/104",
    filepath: "./public/report/ideasheet-umum.pdf",
  });
  res.send("print pdf");
});

router.get("/print/kyt", async (req, res) => {
  const opts = {
    url: "http://localhost:3001/api/report/kyt/127",
    filepath: "./public/report/ideasheet-kyt.pdf",
  };
  await printPdf(opts);
  res.send("print pdf");
});

router.post("/", async (req, res) => {
  try {
  } catch (error) {}
});

module.exports = router;
