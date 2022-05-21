const express = require("express");
const puppeteer = require("puppeteer");

const router = express.Router();

const printPdf = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3001/api/report", {
    waitUntil: "networkidle0",
  });
  const pdf = await page.pdf({ format: "A4", path: "ideasheet.pdf" });

  await browser.close();
};

router.get("/", async (req, res) => {
  res.render("ideasheet_umum");
});

router.get("/print", async (req, res) => {
  await printPdf();
  res.send("print pdf");
});
module.exports = router;
