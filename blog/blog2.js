import puppeteer from "puppeteer";

const url = "https://overreacted.io/";

const overReacted = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const allArticles = await page.evaluate(() => {
    const articles = document.querySelectorAll("article");

    return Array.from(articles)
      .slice(0, 5)
      .map((article) => {
        const title = article.querySelector("h2").innerText;
        const pTags = article.querySelectorAll("p");
        // const paragraphs = Array.from(pTags).map((p) => p.innerText.trim());
        const p1 = pTags[0] ? pTags[0].innerText.trim() : "";
        const p2 = pTags[1] ? pTags[1].innerText.trim() : "";
        return { title, p1, p2 };
      });
  });
  console.log(allArticles);
};

export { overReacted };
