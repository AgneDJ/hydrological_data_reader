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

  for (let i = 0; i < 99; i++) {
    console.log(`Processing location at index: ${i}`);
    try {
      // Click the location using the myclick function
      const result = await page.evaluate((i) => {
        if (typeof myclick === "function") {
          myclick(i);
        } else {
          throw new Error("myclick function not found on page.");
        }
      }, i);

      if (result instanceof Error) {
        throw result;
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Wait for the data window to appear
      await page.waitForSelector(".gm-style-iw-d", { timeout: 30000 });

      // Extract the data from the info window
      const data = await page.evaluate(() => {
        const element = document.querySelector(".gm-style-iw-d");
        return element ? element.textContent.trim() : null;
      });

      if (data) {
        console.log(`Data extracted: ${data}`);
        allData.push(data.split(",")); // Split data for CSV
      } else {
        console.log("No data found for this location.");
      }

      // Close the info window by clicking off of it
      const location = locations[i % locations.length];
      await page.mouse.click(location.x + 20, location.y + 20);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Error during iteration ${i}:`, error.message);
    }
  }

  // Filter unique rows before saving
  const uniqueData = Array.from(new Set(allData.map(JSON.stringify))).map(
    JSON.parse
  );

  if (uniqueData.length > 0) {
    const csvContent = uniqueData.map((row) => row.join(",")).join("\n");

    try {
      // Optional: Delete the old file to ensure no residual data
      if (fs.existsSync("extracted_data.csv")) {
        fs.unlinkSync("extracted_data.csv");
        console.log("Old file removed successfully.");
      }

      // Write the new data
      fs.writeFileSync("extracted_data.csv", csvContent, "utf-8");
      console.log("Data saved to extracted_data.csv");
    } catch (error) {
      console.error("Error saving data to CSV:", error.message);
    }
  } else {
    console.log("No new data extracted to save.");
  }

  await browser.close();
})();
