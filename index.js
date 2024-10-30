const puppeteer = require("puppeteer"); // Puppeteer library to control headless Chrome
const fs = require("fs"); // File system module to handle file operations
const path = require("path"); // Path module to handle file paths
const ExcelJS = require("exceljs"); // ExcelJS library to handle Excel file operations

// Manual delay function using setTimeout
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

// Function to set current date in a specific cell in Excel
const setDateInExcelSheet = async (excelFilePath, sheetName, cellAddress) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelFilePath); // Load the Excel file
  const sheet = workbook.getWorksheet(sheetName); // Access the specified sheet

  // Set the current date in the specified cell
  const currentDate = new Date();
  sheet.getCell(cellAddress).value = currentDate.toISOString().split("T")[0]; // Set only the date part in YYYY-MM-DD format

  await workbook.xlsx.writeFile(excelFilePath); // Save changes to the Excel file
  console.log(
    `Updated ${cellAddress} in sheet '${sheetName}' with current date: ${
      currentDate.toISOString().split("T")[0]
    }`
  );
};

// Function to fetch data from the website with retry logic
const fetchData = async (weatherDataFile) => {
  console.log(`Fetching data for file: ${weatherDataFile}`); // Log the file being fetched
  let success = false; // Variable to track success
  let attempts = 0; // Track number of attempts
  const maxAttempts = 15; // Retry up to 15 times

  while (!success && attempts < maxAttempts) {
    let browser;
    try {
      // Launch Puppeteer browser
      browser = await puppeteer.launch({
        headless: true, // Run browser in headless mode
        args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required options for running Puppeteer
      });

      const page = await browser.newPage(); // Open a new page
      // Navigate to the website
      await page.goto(
        "http://himed.meteo.lt/himed/hidrologija_aws.php",
        { timeout: 180000 } // Timeout after 3 minutes
      );
      await delay(5000); // Wait for 5 seconds for the page to load

      // Wait for the specific table selector to appear
      await page.waitForSelector("table.duom_lent", { timeout: 60000 });

      // Scrape the table data
      const tableData = await page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll("table.duom_lent tr")
        );
        // Extract rows and cells from the table
        return rows.map((row) => {
          const cells = Array.from(row.querySelectorAll("th, td"));
          return cells.map((cell) => cell.textContent.trim()); // Get text content of each cell
        });
      });

      // Convert table data to CSV format and save it to a file
      const csvContent = tableData.map((row) => row.join(",")).join("\n");
      fs.writeFileSync(path.join(__dirname, weatherDataFile), csvContent); // Save CSV data to file
      console.log(`Data saved to ${weatherDataFile}`);
      success = true; // Mark success if data is saved
    } catch (error) {
      console.error(`Error: ${error.message}`); // Log any errors encountered
      attempts++; // Increment retry attempts
      console.log(`Retry attempt ${attempts} of ${maxAttempts}`);
      await delay(15000); // Wait 15 seconds before retrying
    } finally {
      if (browser) await browser.close(); // Close the browser after each attempt
    }
  }

  if (!success) {
    console.error("Max attempts reached. Unable to fetch data."); // Log failure after max attempts
  }
};

// Function to shift data in columns in the Excel sheet
const shiftColumns = (sheet, colFrom, colTo) => {
  for (let i = 4; i <= 65; i++) {
    const fromValue = sheet.getCell(`${colFrom}${i}`).value; // Get value from the source column
    sheet.getCell(`${colTo}${i}`).value = fromValue; // Copy the value to the target column
    console.log(
      `Shifting value from ${colFrom}${i} to ${colTo}${i}: ${fromValue}` // Log each shift operation
    );
  }
};

// Function to extract the date part from a cell value (removes time part if present)
const extractDateFromCell = (cellValue) => {
  if (cellValue) {
    const dateValue = new Date(cellValue); // Try to parse the cell value as a date
    return isNaN(dateValue.getTime())
      ? cellValue.toString().split(" ")[0] // Return only the date part if valid
      : dateValue.toISOString().split("T")[0]; // Return the date in YYYY-MM-DD format
  }
  return null; // Return null if no date is found
};

// Function to update Excel with data from CSV and perform matching and latest date logic
const updateExcelFromCSV = async (
  csvFilePath,
  excelFilePath,
  sheetName,
  columnMapping,
  pinnColumn,
  targetPinnColumn,
  timeFilter, // Optional time filter for matching specific times
  dateColumnIndex = 3, // Column index for the date in CSV (D column)
  pinnColumnIndex = 2 // Column index for the pinn in CSV (C column)
) => {
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`); // Log if CSV file is missing
    return;
  }

  // Read CSV file and split into rows
  const weatherData = fs.readFileSync(csvFilePath, "utf8");
  const weatherRows = weatherData.split("\n").map((row) => row.split(","));

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelFilePath); // Open the Excel file
  const sheet = workbook.getWorksheet(sheetName); // Access the specified sheet

  console.log(`Updating sheet: ${sheetName}`);

  // Loop through each row in Excel
  for (let i = 4; i <= 65; i++) {
    const pinn = sheet.getCell(`${pinnColumn}${i}`).value?.toString().trim(); // Get the pinn value in the current row
    if (pinn) {
      // Find all matching rows in CSV based on pinn
      const matchingRows = weatherRows.filter(
        (row) => row[pinnColumnIndex]?.toString().trim() === pinn
      );

      if (matchingRows.length > 0) {
        // Find the row with the latest date
        let latestRow = matchingRows.reduce((latest, current) => {
          const currentDate = new Date(current[dateColumnIndex]); // Parse the date in current row
          const latestDate = new Date(latest[dateColumnIndex]); // Parse the date in latest row
          return currentDate > latestDate ? current : latest; // Compare dates and return latest
        });

        // Apply the time filter if provided
        if (timeFilter && !latestRow[dateColumnIndex]?.includes(timeFilter)) {
          latestRow = null; // Skip if the time filter doesn't match
        }

        if (latestRow) {
          // Update the Excel sheet with the data from the latest row
          Object.keys(columnMapping).forEach((csvCol) => {
            const targetExcelCol = columnMapping[csvCol]; // Map CSV column to Excel column
            const value = parseFloat(latestRow[csvCol]); // Parse value as float

            sheet.getCell(`${targetExcelCol}${i}`).value = isNaN(value)
              ? null
              : value; // Store the value or leave blank if invalid
          });
          console.log(`Row ${i} updated for Pinn ${pinn}`);
        }
      } else {
        console.log(`No matching Pinn for row ${i} with Pinn ${pinn}`);
      }
    }
  }

  await workbook.xlsx.writeFile(excelFilePath); // Save changes to Excel file
  console.log(`Excel file updated: ${excelFilePath}`);
};

// Main function to handle tasks based on the time window
const runBasedOnTimeWindow = async () => {
  await setDateInExcelSheet(
    "Dienos situacija_test.xlsx",
    "Paros pokytis",
    "B1"
  ); // Set the current date in cell B1

  const now = new Date(); // Get current date and time
  const currentHour = now.getHours(); // Get current hour
  const currentMinute = now.getMinutes(); // Get current minute
  console.log(`Current time: ${currentHour}:${currentMinute}`);

  // 08:30 Task
  if (
    currentHour >= 6 &&
    (currentHour < 14 || (currentHour === 14 && currentMinute < 0))
  ) {
    console.log("Starting task: 08:30 for sheet: Paros pokytis");

    // Fetch weather data for the 08:30 task
    await fetchData("weather_data.csv");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile("Dienos situacija_test.xlsx"); // Read Excel file
    const sheet = workbook.getWorksheet("Paros pokytis"); // Access the 'Paros pokytis' sheet

    // Extract the date from D2 in weather_data.csv (without the time part)
    const weatherDataCSV = fs.readFileSync("weather_data.csv", "utf8");
    const weatherDataRows = weatherDataCSV
      .split("\n")
      .map((row) => row.split(","));
    const dateFromWeatherData = extractDateFromCell(weatherDataRows[1][3]);

    // Update G2, X2, and AB2 with the date from weather_data.csv
    sheet.getCell("G2").value = dateFromWeatherData;
    sheet.getCell("X2").value = dateFromWeatherData;
    sheet.getCell("AB2").value = dateFromWeatherData;
    console.log(`Updated G2, X2, and AB2 with date: ${dateFromWeatherData}`);

    // Extract dates from cells G2, X2, AB2, and B1
    const cellB1Date = extractDateFromCell(sheet.getCell("B1").value);
    const cellG2Date = extractDateFromCell(sheet.getCell("G2").value);
    const cellX2Date = extractDateFromCell(sheet.getCell("X2").value);
    const cellAB2Date = extractDateFromCell(sheet.getCell("AB2").value);

    // Check if dates in G2, X2, AB2 match B1 before shifting
    if (
      cellG2Date === cellB1Date &&
      cellX2Date === cellB1Date &&
      cellAB2Date === cellB1Date
    ) {
      console.log("No shifting needed as G2, X2, AB2 match B1");
    } else {
      // Shift columns G -> F -> E -> D, and X -> W, AB -> AA if dates don't match
      shiftColumns(sheet, "E", "D");
      shiftColumns(sheet, "F", "E");
      shiftColumns(sheet, "G", "F");

      shiftColumns(sheet, "X", "W");
      shiftColumns(sheet, "AB", "AA");

      // Clear new data columns before adding
      for (let i = 4; i <= 65; i++) {
        sheet.getCell(`G${i}`).value = null;
        sheet.getCell(`X${i}`).value = null;
        sheet.getCell(`AB${i}`).value = null;
      }

      console.log("Shift operation completed.");
    }

    // Column mappings for 'Paros pokytis' sheet
    const columnMapping = {
      4: "G", // CSV column E -> Excel column G
      5: "X", // CSV column F -> Excel column X
      6: "AB", // CSV column G -> Excel column AB
    };
    await workbook.xlsx.writeFile("Dienos situacija_test.xlsx"); // Save changes to the Excel file

    // Update the Excel file with data from CSV
    await updateExcelFromCSV(
      "weather_data.csv", // CSV file to use
      "Dienos situacija_test.xlsx", // Excel file to update
      "Paros pokytis", // Sheet to update
      columnMapping, // Mapping from CSV columns to Excel columns
      "A", // Pinns in A4:A65 in the Excel sheet
      "A" // Column A contains pinns to match
    );

    // Save the workbook after shifting and updating
    console.log("Shift and date update complete.");
  }

  // 13:30 Task
  if (currentHour >= 13 && currentHour < 16) {
    console.log("Starting task: 13:30 for sheet: Pokytis dienos metu");

    await fetchData("weather_data_13.csv");

    const columnMapping13 = {
      4: "C", // CSV column E -> Excel column C
    };

    // Update the Excel file for 13:30 task
    await updateExcelFromCSV(
      "weather_data_13.csv", // CSV file to use
      "Dienos situacija_test.xlsx", // Excel file to update
      "Pokytis dienos metu", // Sheet to update
      columnMapping13, // Mapping from CSV columns to Excel columns
      "P", // Pinns in P4:P65 in the Excel sheet
      "P", // Column P contains pinns to match
      "10:00" // Only add rows where column D contains 10:00 utc in date-time
    );
  }

  // 16:30 Task
  if (currentHour >= 16 && currentHour < 18) {
    console.log(currentHour);
    console.log("Starting task: 16:30 for sheet: Pokytis dienos metu");

    await fetchData("weather_data_16.csv");

    const columnMapping16 = {
      4: "D", // CSV column E -> Excel column D
    };

    // Update the Excel file for 16:30 task
    await updateExcelFromCSV(
      "weather_data_16.csv", // CSV file to use
      "Dienos situacija_test.xlsx", // Excel file to update
      "Pokytis dienos metu", // Sheet to update
      columnMapping16, // Mapping from CSV columns to Excel columns
      "P", // Pinns in P4:P65 in the Excel sheet
      "P", // Column P contains pinns to match
      "13:00" // Only add rows where column D contains 13:00 utc in date-time
    );
  }
};

// Run the main function to trigger tasks based on the current time window
runBasedOnTimeWindow();

// pridetas datos addinimas. veikia gerai.
