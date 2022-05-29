const puppeteer = require("puppeteer");
const logger = require("./logger");

module.exports = async ({ url, filepath }) => {
  console.log(filepath);
  logger.info("Generate pdf : " + filepath);

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });
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
