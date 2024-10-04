import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";

async function downloadImage(url, folderPath, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Fail to fetch image: ${response.status}, ${response.statusText}`,
      );
    }
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const filePath = path.join(folderPath, filename);
    const fileStream = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on("error", reject);
      fileStream.on("finish", resolve);
    });
    console.log(`Image saved as ${filePath}`);
  } catch (error) {
    console.error(`Error downloading image: ${error.message}`);
  }
}

async function fetchUniqloData() {
  // Launch a new browser instance
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to the URL where the article is located
  try {
    console.log("CPU Usage before Navigation: ", process.cpuUsage());
    console.log("Memory Usage before Navigation: ", process.memoryUsage());
    await page.goto("https://www.uniqlo.com/th/en/", {
      waitUntil: "networkidle2",
    });
    // Extract data from the article element
    const articleData = await page.evaluate(() => {
      const categoryArticle = [];
      const articles = document.querySelectorAll(".fr-banner-media-article");
      if (!articles) return null;
      let count = 1;
      articles.forEach((article) => {
        const image = article.querySelector(".banner-image img")?.src || "";
        const title = article.querySelector(".title")?.innerText.trim() || "";
        const description =
          article.querySelector(".description")?.innerText.trim() || "";
        const originalPrice =
          article
            .querySelector(".dual-price-original-inner")
            ?.innerText.trim() || "";
        const discountedPrice =
          article.querySelector(".price-limited")?.innerText.trim() || "";
        const statusFlag =
          article.querySelector(".fr-status-flag-text")?.innerText.trim() || "";

        categoryArticle.push({
          count,
          image,
          title,
          description,
          originalPrice,
          discountedPrice,
          statusFlag,
        });
        count++;
      });
      console.log(categoryArticle);
      return categoryArticle;
    });
    if (articleData) {
      console.log("Article: ", articleData);
      fs.writeFileSync(
        "ScrapedUniqloArticle.json",
        JSON.stringify(articleData, null, 2),
        "utf-8",
      );
      console.log("Data saved Successfully to ScrapedUniqloArticle.json file");
      // Download each image to a specific folder
      const imageFolder = "./images";
      for (let i = 0; i < articleData.length; i++) {
        const imageUrl = articleData[i].image;
        if (imageUrl) {
          const imageName = `image-${articleData[i].count}.jpg`;
          await downloadImage(imageUrl, imageFolder, imageName);
        }
      }
    } else {
      console.log("Article not found");
    }
    console.log("CPU Usage after Navigation: ", process.cpuUsage());
    console.log("Memory Usage after Navigation: ", process.memoryUsage());
  } catch (error) {
    console.error("Error occured while scraping: ", error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

fetchUniqloData();
