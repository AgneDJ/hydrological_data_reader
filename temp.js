const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set user agent for better emulation
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );

  // Navigate to the webpage
  await page.goto("http://himed.meteo.lt/index.php/biuletenis/", {
    waitUntil: "networkidle2",
  });

  // Optional: Log page content for debugging
  console.log(await page.content());

  // Wait for the table to load or be visible
  try {
    await page.waitForSelector("#datepicker", {
      timeout: 15000,
      visible: true,
    });
  } catch (error) {
    console.error(
      'Table with id="datepicker" not found or did not load within the specified timeout.'
    );
    await browser.close();
    return;
  }

  // Extract table data
  const tableData = await page.evaluate(() => {
    const table = document.getElementById("datepicker");
    if (!table) {
      return null; // Handle this case more gracefully within the browser context
    }

    const rows = Array.from(table.querySelectorAll("tr"));
    const data = [];

    data.push([
      "Stotis",
      "Vidutinė oro temperatūra praėjusią parą",
      "Žemiausia oro temperatūra šią naktį",
    ]);

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td, th");
      if (cells.length >= 3) {
        const rowData = [
          cells[0].innerText.trim(),
          cells[1].innerText.trim(),
          cells[2].innerText.trim(),
        ];
        data.push(rowData);
      }
    });

    return data;
  });

  if (tableData === null) {
    console.error("Table extraction failed.");
    await browser.close();
    return;
  }

  // Convert data to CSV format and save
  const csvContent = tableData.map((row) => row.join(",")).join("\n");
  fs.writeFileSync("weather_data.csv", csvContent);
  console.log("CSV file has been saved: weather_data.csv");

  await browser.close();
})();
