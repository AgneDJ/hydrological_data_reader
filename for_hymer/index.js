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
    console.log(`Clicking location at i: ${i}`);
    await page.evaluate((i) => {
      myclick(i);
    }, i);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      await page.waitForSelector(".gm-style-iw-d", { timeout: 30000 });
      const data = await page.evaluate(() => {
        const element = document.querySelector(".gm-style-iw-d");
        return element ? element.textContent.trim() : null;
      });

      if (data) {
        console.log(`Data extracted: ${data}`);
        // Split data into cells for CSV (assuming comma separation for demonstration)
        allData.push(data.split(","));
      } else {
        console.log("No data found for this location.");
      }

      // Close the info window by clicking off of it
      await page.mouse.click(
        locations[i % locations.length].x + 20,
        locations[i % locations.length].y + 20
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      console.error("Error extracting data:", error);
    }
  }

  // Filter unique rows before saving
  const uniqueData = Array.from(new Set(allData.map(JSON.stringify))).map(
    JSON.parse
  );

  if (uniqueData.length > 0) {
    const csvContent = uniqueData.map((row) => row.join(",")).join("\n");

    fs.writeFileSync("extracted_data.csv", csvContent, "utf-8");
    console.log("Data saved to extracted_data.csv");
  } else {
    console.log("No data extracted to save.");
  }

  await browser.close();
})();
