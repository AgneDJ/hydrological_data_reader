const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// Delay function for waiting
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

// Function to scrape data for a specific date and save it to CSV
const scrapeDuomLentTableForDate = async (targetDate) => {
  const dateString = targetDate.replace(/\//g, "-");
  const outputCsvFile = `table_data_duom_lent_${dateString}.csv`;

  console.log(
    `Starting data scraping for ${outputCsvFile} for date: ${targetDate}`
  );
  let browser = null;

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
    const iframeElement = await page.waitForSelector(
      "iframe[src*='maksimum_data.php']",
      { timeout: 120000 }
    );
    const iframe = await iframeElement.contentFrame();

    if (!iframe) {
      throw new Error("Failed to access iframe content.");
    }

    // Wait for the date input field
    console.log("Setting the target date...");
    await iframe.waitForSelector("input[name='calendar']", { timeout: 120000 });

    // Set the target date and trigger change events
    await iframe.$eval(
      "input[name='calendar']",
      (input, date) => {
        input.value = date; // Set the target date
        const changeEvent = new Event("change", { bubbles: true });
        input.dispatchEvent(changeEvent); // Trigger the change event
        const blurEvent = new Event("blur", { bubbles: true });
        input.dispatchEvent(blurEvent); // Trigger the blur event
      },
      targetDate
    );

    // Verify that the date is set
    const actualDate = await iframe.$eval(
      "input[name='calendar']",
      (input) => input.value
    );
    if (actualDate !== targetDate) {
      throw new Error(
        `Failed to set the target date. Current date is: ${actualDate}`
      );
    }
    console.log(`Target date successfully set to: ${actualDate}`);

    // Wait for the table to update after setting the date
    console.log("Waiting for the table to update...");
    await iframe.waitForSelector("table.duom_lent", { timeout: 120000 });

    // Extract table data
    console.log(`Extracting data for date: ${targetDate}`);
    const tableData = await iframe.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("table.duom_lent tr"));
      return rows.map((row) => {
        const cells = Array.from(row.querySelectorAll("th, td"));
        return cells.map((cell) => cell.textContent.trim());
      });
    });

    // Log the first few rows for verification
    console.log(`Extracted ${tableData.length} rows. First row:`, tableData[0]);

    // Convert the table data into CSV format
    const csvContent = tableData.map((row) => row.join(",")).join("\n");

    // Save the CSV content to a file
    const outputPath = path.join(__dirname, outputCsvFile);
    fs.writeFileSync(outputPath, csvContent, "utf8");

    console.log(`Table data saved to: ${outputPath}`);
  } catch (error) {
    console.error(`Error during scraping: ${error.message}`);
    const debugHtml = await page.content();
    fs.writeFileSync("debug.html", debugHtml);
    console.log("Saved debug HTML to debug.html for inspection.");
  } finally {
    if (browser) await browser.close();
  }
};

// Function to scrape data for multiple dates
const scrapeForMultipleDates = async (dates) => {
  for (const date of dates) {
    console.log(`\nProcessing date: ${date}`);
    await scrapeDuomLentTableForDate(date);
    console.log(`Finished processing date: ${date}\n`);
  }
};

// List of dates to process
const datesToProcess = ["2024/11/22", "2024/11/23", "2024/11/24"];
scrapeForMultipleDates(datesToProcess);
