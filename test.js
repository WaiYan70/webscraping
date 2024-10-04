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
      const womenJeans = document.querySelectorAll(
        ".swiper-wrapper .fr-bff-product",
      );
      if (!womenJeans) return null;
      let count = 1;
      womenJeans.forEach((womenJean) => {
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

        categoryWomenJeans.push({
          count,
          image,
          title,
          originalPrice,
        });
        count++;
      });
      return categoryWomenJeans;
    });

    if (womenJeansData) {
      console.log("Uniqlo Women Jeans: ", womenJeansData);

      // Create a folder for JSON data
      const jsonFolder = "./data";
      if (!fs.existsSync(jsonFolder)) {
        fs.mkdirSync(jsonFolder, { recursive: true });
      }

      // Save the JSON data in the ./data folder
      const jsonFilePath = path.join(jsonFolder, "UniqloWomenJeans.json");
      fs.writeFileSync(
        jsonFilePath,
        JSON.stringify(womenJeansData, null, 2),
        "utf-8",
      );
      console.log(`Data saved Successfully to ${jsonFilePath}`);

      // Create a folder for images
      const imageFolder = "./images/uniqlo-women-images";
      if (!fs.existsSync(imageFolder)) {
        fs.mkdirSync(imageFolder, { recursive: true });
      }

      // Download each image to the specific image folder
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
    console.error("Error occurred while scraping: ", error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

fetchWomenJeansData();
