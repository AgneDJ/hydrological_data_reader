const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");

// Apply stealth plugin to reduce detection chances
puppeteer.use(StealthPlugin());

// Delay function
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

const scrapeDuomLentTable = async () => {
  const today = new Date();
  const dateString = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const outputCsvFile = `table_data_duom_lent_${dateString}.csv`;

  console.log(`Starting data scraping for ${outputCsvFile}`);

  let browser;
  let page;

  try {
    // Launch Puppeteer with additional flags
    browser = await puppeteer.launch({
      // If you want to use a local installation of Chrome, uncomment the line below and adjust the path:
      // executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: false, // Change to true after debugging
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-features=HttpsFirstBalancedModeAutoEnable",
        "--disable-blink-features=AutomationControlled",
        "--disable-extensions",
        "--incognito",
      ],
    });

    page = await browser.newPage();

    // Set a common user-agent string
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36"
    );

    // Navigate to the main page (verify the URL is correct)
    console.log("Navigating to the website...");
    await page.goto("http://himed.meteo.lt/index.php/biuletenis/", {
      waitUntil: "networkidle2",
      timeout: 180000,
    });

    // Wait for the iframe to appear
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

    // Wait for the table inside the iframe
    console.log("Waiting for the table inside the iframe...");
    await iframe.waitForSelector("table.duom_lent", { timeout: 120000 });

    // Extract table data
    console.log("Extracting table data...");
    const tableData = await iframe.evaluate(() => {
      return Array.from(document.querySelectorAll("table.duom_lent tr")).map(
        (row) =>
          Array.from(row.querySelectorAll("th, td")).map((cell) =>
            cell.textContent.trim()
          )
      );
    });

    if (tableData.length === 0) {
      throw new Error("No table data found.");
    }

    // Convert table data to CSV format
    const csvContent = tableData.map((row) => row.join(",")).join("\n");

    // Save CSV file
    const outputPath = path.join(__dirname, outputCsvFile);
    fs.writeFileSync(outputPath, csvContent, "utf8");
    console.log(`Table data saved to: ${outputPath}`);
  } catch (error) {
    console.error(`Error during scraping: ${error.message}`);

    if (page) {
      // Save screenshot and HTML for debugging
      await page.screenshot({ path: "debug.png", fullPage: true });
      const html = await page.content();
      fs.writeFileSync("debug.html", html);
      console.log("Saved debug information (debug.png, debug.html)");
    }
  } finally {
    if (browser) await browser.close();
  }
};

scrapeDuomLentTable();
