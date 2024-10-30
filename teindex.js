const puppeteer = require("puppeteer"); // Puppeteer library to control headless Chrome
const fs = require("fs"); // File system module to handle file operations
const path = require("path"); // Path module to handle file paths
const ExcelJS = require("exceljs"); // ExcelJS library to handle Excel file operations

// Manual delay function using setTimeout
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

// Function to set the current date in a specific cell in Excel
const setDateInExcelSheet = async (excelFilePath, sheetName, cellAddress) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelFilePath);
  const sheet = workbook.getWorksheet(sheetName);
  const currentDate = new Date();
  sheet.getCell(cellAddress).value = currentDate.toISOString().split("T")[0];
  await workbook.xlsx.writeFile(excelFilePath);
  console.log(
    `Updated ${cellAddress} in sheet '${sheetName}' with current date: ${
      currentDate.toISOString().split("T")[0]
    }`
  );
};

// Function to fetch data from the website with retry logic
const fetchData = async (weatherDataFile) => {
  console.log(`Fetching data for file: ${weatherDataFile}`);
  let success = false;
  let attempts = 0;
  const maxAttempts = 15;

  while (!success && attempts < maxAttempts) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.goto("http://himed.meteo.lt/himed/hidrologija_aws.php", {
        timeout: 180000,
      });
      await delay(5000);

      await page.waitForSelector("table.duom_lent", { timeout: 60000 });

      const tableData = await page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll("table.duom_lent tr")
        );
        return rows.map((row) => {
          const cells = Array.from(row.querySelectorAll("th, td"));
          return cells.map((cell) => cell.textContent.trim());
        });
      });

      const csvContent = tableData.map((row) => row.join(",")).join("\n");
      fs.writeFileSync(path.join(__dirname, weatherDataFile), csvContent);
      console.log(`Data saved to ${weatherDataFile}`);
      success = true;
    } catch (error) {
      console.error(`Error: ${error.message}`);
      attempts++;
      console.log(`Retry attempt ${attempts} of ${maxAttempts}`);
      await delay(15000);
    } finally {
      if (browser) await browser.close();
    }
  }

  if (!success) {
    console.error("Max attempts reached. Unable to fetch data.");
  }
};

// Function to update Excel with data from CSV
const updateExcelFromCSV = async (
  csvFilePath,
  excelFilePath,
  sheetName,
  columnMapping,
  pinnColumn,
  targetPinnColumn,
  timeFilter,
  dateColumnIndex = 3,
  pinnColumnIndex = 2
) => {
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`);
    return;
  }

  const weatherData = fs.readFileSync(csvFilePath, "utf8");
  const weatherRows = weatherData.split("\n").map((row) => row.split(","));

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelFilePath);
  const sheet = workbook.getWorksheet(sheetName);

  console.log(`Updating sheet: ${sheetName}`);

  for (let i = 4; i <= 65; i++) {
    const pinn = sheet.getCell(`${pinnColumn}${i}`).value?.toString().trim();
    if (pinn) {
      const matchingRows = weatherRows.filter(
        (row) => row[pinnColumnIndex]?.toString().trim() === pinn
      );

      if (matchingRows.length > 0) {
        let latestRow = matchingRows.reduce((latest, current) => {
          const currentDate = new Date(current[dateColumnIndex]);
          const latestDate = new Date(latest[dateColumnIndex]);
          return currentDate > latestDate ? current : latest;
        });

        if (timeFilter && !latestRow[dateColumnIndex]?.includes(timeFilter)) {
          latestRow = null;
        }

        if (latestRow) {
          Object.keys(columnMapping).forEach((csvCol) => {
            const targetExcelCol = columnMapping[csvCol];
            const value = parseFloat(latestRow[csvCol]);
            sheet.getCell(`${targetExcelCol}${i}`).value = isNaN(value)
              ? null
              : value;
          });
          console.log(`Row ${i} updated for Pinn ${pinn}`);
        }
      } else {
        console.log(`No matching Pinn for row ${i} with Pinn ${pinn}`);
      }
    }
  }

  await workbook.xlsx.writeFile(excelFilePath);
  console.log(`Excel file updated: ${excelFilePath}`);
};

// Main function to handle tasks based on the time window
const runBasedOnTimeWindow = async () => {
  await setDateInExcelSheet(
    "Dienos situacija_test.xlsx",
    "Paros pokytis",
    "B1"
  );

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  console.log(`Current time: ${currentHour}:${currentMinute}`);

  // 08:30 Task
  if (
    currentHour >= 6 &&
    (currentHour < 14 || (currentHour === 14 && currentMinute < 0))
  ) {
    console.log("Starting task: 08:30 for sheet: Paros pokytis");

    await fetchData("weather_data.csv");

    const columnMapping = {
      4: "G",
      5: "X",
      6: "AB",
    };
    await updateExcelFromCSV(
      "weather_data.csv",
      "Dienos situacija_test.xlsx",
      "Paros pokytis",
      columnMapping,
      "A",
      "A"
    );

    console.log("08:30 update complete.");
  }

  // 13:30 Task
  if (currentHour >= 13 && currentHour < 16) {
    console.log("Starting task: 13:30 for sheet: Pokytis dienos metu");

    await fetchData("weather_data_13.csv");

    const columnMapping13 = {
      4: "C",
    };

    await setDateInExcelSheet(
      "Dienos situacija_test.xlsx",
      "Pokytis dienos metu",
      "C2"
    );
    await updateExcelFromCSV(
      "weather_data_13.csv",
      "Dienos situacija_test.xlsx",
      "Pokytis dienos metu",
      columnMapping13,
      "P",
      "P",
      "10:00"
    );

    console.log("13:30 update complete.");
  }

  // 16:30 Task
  if (currentHour >= 16 && currentHour < 18) {
    console.log("Starting task: 16:30 for sheet: Pokytis dienos metu");

    const columnMapping16 = {
      4: "D",
    };

    await setDateInExcelSheet(
      "Dienos situacija_test.xlsx",
      "Pokytis dienos metu",
      "D2"
    );
    await updateExcelFromCSV(
      "weather_data_13.csv",
      "Dienos situacija_test.xlsx",
      "Pokytis dienos metu",
      columnMapping16,
      "P",
      "P",
      "13:00"
    );

    console.log("16:30 update complete.");
  }
};

runBasedOnTimeWindow();
