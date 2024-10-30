const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("http://hymer.meteo.lt", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // Initial wait to allow map and elements to fully load
  await new Promise((resolve) => setTimeout(resolve, 10000));

  const locations = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 300, y: 150 },
    // add more coordinates if needed
  ];

  let allData = [];

  for (var i = 0; i < 99; i++) {
    // Click on each location and extract the data
    console.log(`Clicking location at i: ${i}`);
    await page.evaluate((i) => {
      myclick(i);
    }, i);
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Adjust wait time as needed

    try {
      await page.waitForSelector(".gm-style-iw-d", { timeout: 30000 });
      const data = await page.evaluate(() => {
        const element = document.querySelector(".gm-style-iw-d");
        return element ? element.textContent.trim() : null;
      });

      if (data) {
        console.log(`Data extracted: ${data}`);
        allData.push(data);
      } else {
        console.log("No data found for this location.");
      }

      // Close the info window by clicking off of it
      await page.mouse.click(loc.x + 20, loc.y + 20);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      console.error("Error extracting data:", error);
    }
  }

  // Filter unique entries before saving
  const uniqueData = [...new Set(allData)];

  if (uniqueData.length > 0) {
    fs.writeFileSync("extracted_data.csv", uniqueData.join("\n"), "utf-8");
    console.log("Data saved to extracted_data.csv");
  } else {
    console.log("No data extracted to save.");
  }

  await browser.close();
})();
