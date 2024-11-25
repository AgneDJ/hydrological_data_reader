const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// Delay function for waiting
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

// Function to scrape data from the iframe and save it to a date-specific CSV
const scrapeDuomLentTable = async () => {
  // Generate the file name with today's date
  const today = new Date();
  const dateString = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const outputCsvFile = `table_data_duom_lent_${dateString}.csv`;

  console.log(`Starting data scraping for ${outputCsvFile}`);
  let browser;

  try {
    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    // Navigate to the main page
    await page.goto("http://himed.meteo.lt/index.php/biuletenis/", {
      timeout: 180000,
    });

    // Wait for the iframe to load
    console.log("Waiting for the iframe to load...");
    await page.waitForSelector("iframe[src*='maksimum_data.php']", {
      timeout: 120000,
    });

    // Access the iframe
    const iframeElement = await page.$("iframe[src*='maksimum_data.php']");
    const iframe = await iframeElement.contentFrame();

    if (!iframe) {
      throw new Error("Failed to access iframe content.");
    }

    // Wait for the table with class 'duom_lent' inside the iframe
    console.log("Waiting for the table inside the iframe...");
    await iframe.waitForSelector("table.duom_lent", { timeout: 120000 });

    // Extract table data
    const tableData = await iframe.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("table.duom_lent tr"));
      return rows.map((row) => {
        const cells = Array.from(row.querySelectorAll("th, td"));
        return cells.map((cell) => cell.textContent.trim()); // Extract text content and trim whitespace
      });
    });

    // Convert the table data into CSV format
    const csvContent = tableData.map((row) => row.join(",")).join("\n");

    // Save the CSV content to a file
    const outputPath = path.join(__dirname, outputCsvFile);
    fs.writeFileSync(outputPath, csvContent, "utf8");

    console.log(`Table data saved to: ${outputPath}`);
  } catch (error) {
    console.error(`Error during scraping: ${error.message}`);
    // Save HTML for debugging
    if (browser) {
      const html = await page.content();
      fs.writeFileSync("debug.html", html);
    }
  } finally {
    if (browser) await browser.close();
  }
};

// Call the function
scrapeDuomLentTable();
