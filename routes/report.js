const express = require("express");
const puppeteer = require("puppeteer");
const appConfig = require("config");
const path = require("path");
const fs = require("fs");
const appRoot = require("app-root-path");
const config = appConfig.get("ideabox");
const queryPdf = require("../queries/ideaboxPdfQuery");
const repo = require("../repositories/ideaboxRepository");
const archiver = require("zip-a-folder");
const logger = require("../utils/logger");
const moment = require("moment");

const router = express.Router();
const BASE_URL = appConfig.get("base_url");

const printPdf = async ({ url, filepath }) => {
  //console.log(filepath);
  //logger.info("Generate pdf : " + filepath);

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
  const base_url = appConfig.get("base_url");
  const ideaboxId = req.params.id;
  const ideabox = await queryPdf.getData(ideaboxId);

  const { master, detail, comment, impact } = ideabox;

  //console.log("master:", master);

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
    afterImage: `${base_url}/public/ideabox/${detail.afterImage}`,
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
  const base_url = appConfig.get("base_url");
  const ideaboxId = req.params.id;
  const ideabox = await queryPdf.getData(ideaboxId);

  const { master, detail, comment, impact } = ideabox;

  //console.log("master:", master);

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
    afterImage: `${base_url}/public/ideabox/${detail.afterImage}`,
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
    let { startDate, endDate, type } = req.body;
    const APP_PATH = appRoot.path;

    startDate = startDate.substring(0, 10);
    endDate = endDate.substring(0, 10);

    logger.info("Generate report : " + startDate + " - " + endDate);

    const directoryName = `${startDate.replace(/-/g, "")}-${endDate.replace(
      /-/g,
      ""
    )}`;

    const reportPath = path.join(APP_PATH, "public/report", directoryName);
    const reportUmumPath = path.join(reportPath, "umum");
    const reportQkytPath = path.join(reportPath, "qkyt");

    const from = startDate + " 00:00:00";
    const to = endDate + " 23:59:59";

    const data = await repo.getIdeaboxReport(from, to, type);
    let downloadLink = "";
    let result = "NO_DATA";
    let message = "Ideasheet not found.";

    if (data.length > 0) {
      if (!fs.existsSync(reportPath)) {
        fs.mkdirSync(reportPath);
        fs.mkdirSync(path.join(reportPath, "umum"));
        fs.mkdirSync(path.join(reportPath, "qkyt"));
      }

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const pdfFile = item.pdf_file;

        const sourcePath = path.join(APP_PATH, "public/report", pdfFile);
        const destinationPath =
          item.ideaType === "UMUM"
            ? path.join(reportUmumPath, pdfFile)
            : path.join(reportQkytPath, pdfFile);

        fs.copyFile(sourcePath, destinationPath, (err) => {
          if (err) logger.error(err);
          logger.info(`copying ${pdfFile} to ${destinationPath}`);
        });
      }

      const { zip } = archiver;
      const zipName = directoryName + ".zip";
      const zipPath = path.join(APP_PATH, "public/report", zipName);
      await zip(reportPath, zipPath);

      result = "OK";
      downloadLink = `${BASE_URL}/public/report/${zipName}`;
      message = "Sucessfully generate report";

      //fs.rmSync(reportPath, { recursive: true, force: true });

      fs.rmdir(reportPath, { recursive: true }, (err) => {
        if (err) {
          logger.error(err);
        }

        console.log(`${reportPath} is deleted!`);
        logger.info(`Deleting ${reportPath}`);
      });
    }

    res.status(200).json({
      result: "OK",
      message: message,
      data: { download_link: downloadLink, generated_report: data.length },
      errors: {},
    });

    console.log("done");
    logger.info(`Generate report done : ${downloadLink}`);
  } catch (error) {
    console.error(error);
    logger.error(error);

    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to generate report",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/generate", async (req, res) => {
  try {
    let { startDate, endDate, type } = req.body;
    const APP_PATH = appRoot.path;

    startDate = startDate.substring(0, 10);
    endDate = endDate.substring(0, 10);

    const directoryName = `${startDate.replace(/-/g, "")}-${endDate.replace(
      /-/g,
      ""
    )}`;

    const reportPath = path.join(APP_PATH, "public/report", directoryName);
    const reportUmumPath = path.join(reportPath, "umum");
    const reportQkytPath = path.join(reportPath, "qkyt");

    const from = startDate + " 00:00:00";
    const to = endDate + " 23:59:59";

    const data = await repo.getIdeaboxReport(from, to, type);
    let downloadLink = "";
    let result = "NO_DATA";
    let message = "Ideasheet not found.";

    if (data.length > 0) {
      if (!fs.existsSync(reportPath)) {
        fs.mkdirSync(reportPath);
        fs.mkdirSync(path.join(reportPath, "umum"));
        fs.mkdirSync(path.join(reportPath, "qkyt"));
      }

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const ideaboxId = item.id;
        const ideaNumber = item.ideaNumber.replace(/-/g, "");
        const submitDate = item.submittedAt;

        const url =
          item.ideaType === "UMUM"
            ? `${BASE_URL}/api/report/umum/${ideaboxId}`
            : `${BASE_URL}/api/report/kyt/${ideaboxId}`;

        const pdf = `${ideaNumber}_${item.submittedBy}_${item.ideaType}_${submitDate}.pdf`;

        const pdfPath =
          item.ideaType === "UMUM"
            ? path.join(reportUmumPath, pdf)
            : path.join(reportQkytPath, pdf);

        await printPdf({
          url: url,
          filepath: pdfPath,
        });
      }

      const { zip } = archiver;
      const zipName = directoryName + ".zip";
      const zipPath = path.join(APP_PATH, "public/report", zipName);
      await zip(reportPath, zipPath);

      result = "OK";
      downloadLink = `${BASE_URL}/public/report/${zipName}`;
      message = "Sucessfully generate report";

      //fs.rmSync(reportPath, { recursive: true, force: true });

      fs.rmdir(reportPath, { recursive: true }, (err) => {
        if (err) {
          logger.error(err);
        }

        console.log(`${reportPath} is deleted!`);
      });
    }

    res.status(200).json({
      result: "OK",
      message: message,
      data: { download_link: downloadLink, generated_report: data.length },
      errors: {},
    });

    console.log("done");
  } catch (error) {
    console.error(error);
    logger.error(error);

    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to generate report",
      data: req.body,
      errors: error,
    });
  }
});

module.exports = router;
