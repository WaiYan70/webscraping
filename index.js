// import { joshComeau } from "./blog/blog1.js";
// import { overReacted } from "./blog/blog2.js";

// const main = async () => {
//   joshComeau();
//   overReacted();
// };

// main();
import puppeteer from "puppeteer";

async function scrapeWebsite(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  const data = await page.evaluate(() => {
    const products = [];
    const productElements = document.querySelectorAll(".product"); // Adjust class selector
    productElements.forEach((product) => {
      const title =
        product.querySelector(".product-title")?.innerText || "No title"; // Adjust selector
      const price =
        product.querySelector(".product-price")?.innerText || "No price"; // Adjust selector
      const description =
        product.querySelector(".product-description")?.innerText ||
        "No description"; // Adjust selector

      products.push({ title, price, description });
    });

    return products;
  });
  await browser.close();
  return data;
}

// Example URLs
const uniqloUrl = "https://www.uniqlo.com/th/en/";
const hmUrl = "https://th.hm.com/th_th/";
const zaraUrl = "https://www.zara.com/th/";

// Scrape data from all three websites
// (async () => {
//   console.log("Scraping Uniqlo...");
//   const uniqloData = await scrapeWebsite(uniqloUrl);
//   console.log(uniqloData);
// })();

async function fetchingData() {
  console.log("Scraping the Data");
  const uniqloData = await scrapeWebsite(uniqloUrl);
  console.log(uniqloData);
}

fetchingData();
