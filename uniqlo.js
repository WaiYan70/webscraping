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

async function fetchWomenJeansData() {
  // Launch a new browser instance
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to the URL where the article is located
  try {
    // just testing CPU and Memory Usage
    console.log("CPU Usage before Navigation: ", process.cpuUsage());
    console.log("Memory Usage before Navigation: ", process.memoryUsage());
    await page.goto(
      "https://www.uniqlo.com/th/en/special-feature/jeans/women",
      {
        waitUntil: "networkidle2",
      },
    );
    // Extract data from the Women Jeans Data element
    const womenJeansData = await page.evaluate(() => {
      const categoryWomenJeans = [];
      const baseURL = "https://www.uniqlo.com";
      const womenJeans = document.querySelectorAll(
        ".swiper-wrapper .fr-bff-product",
      );
      if (!womenJeans) return null;
      let count = 1;
      womenJeans.forEach((womenJean) => {
        // due to lazy loading features of Uniqlo, it can get wrong url.
        const image =
          womenJean.querySelector("img.fr-img")?.getAttribute("data-src") ||
          womenJean.querySelector("img.fr-img")?.getAttribute("src") ||
          "";
        const title =
          womenJean.querySelector(".fr-bff-product_name")?.innerText.trim() ||
          "";
        const originalPrice =
          womenJean.querySelector(".fr-bff-product_price")?.innerText.trim() ||
          "";
        const relativeURL = womenJean
          .querySelector("a.fr-bff-product_inner")
          ?.getAttribute("href");
        const fullURL = `${baseURL}${relativeURL}`;

        categoryWomenJeans.push({
          count,
          image,
          title,
          originalPrice,
          fullURL,
        });
        count++;
      });
      console.log(categoryWomenJeans);
      return categoryWomenJeans;
    });
    if (womenJeansData) {
      console.log("Uniqlo Women Jeans: ", womenJeansData);
      // Create a folder for JSON data if the folder is not existed
      const jsonfolder = "./data";
      if (!fs.existsSync(jsonfolder)) {
        fs.mkdirSync(jsonfolder, { recursive: true });
      }
      // Save the JSON data in the newly created "data" folder
      const jsonFilePath = path.join(jsonfolder, "UniqloWomenJeans.json");
      fs.writeFileSync(
        jsonFilePath,
        JSON.stringify(womenJeansData, null, 2),
        "utf-8",
      );
      console.log(`Data saved Successfully to ${jsonFilePath}`);
      // Create a folder for image
      // Download each image to a specific folder
      const imageFolder = "./images/uniqlo-women-images";
      if (!fs.existsSync(imageFolder)) {
        fs.mkdirSync(imageFolder, { recursive: true });
      }
      for (let i = 0; i < womenJeansData.length; i++) {
        const imageUrl = womenJeansData[i].image;
        if (imageUrl) {
          const imageName = `image-${womenJeansData[i].count}.jpg`;
          await downloadImage(imageUrl, imageFolder, imageName);
        }
      }
    } else {
      console.log("Jeans Data are not found");
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

fetchWomenJeansData();
