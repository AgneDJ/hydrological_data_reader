const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const crypto = require("crypto");
const { promisify } = require("util");
const copyFile = promisify(fs.copyFile);
const rename = promisify(fs.rename);

// Function to compute the hash of a file
const computeFileHash = async (filePath) => {
  const hash = crypto.createHash("sha256");
  const stream = fs.createReadStream(filePath);
  return new Promise((resolve, reject) => {
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (err) => reject(err));
  });
};

const updateLedaiFileFromAllCSVs = async () => {
  const csvFolderPath = String.raw`C:\Users\agned\Desktop\Daily Hydro Situation\hydrological_data_reader`;
  const excelFilePath = String.raw`C:\Users\agned\Documents\Darbo Dokumentai\HidroDuomenys\Ledui_vid_temp\@Ledų atsiradimas_ežerai,upės(versija2).xlsx`;
  const networkExcelPath = String.raw`\\192.168.1.30\Dokumentai\PPS\2. Išoriniai\Hidrologinės prognozės\@ Prognozės\Prognozės\Ledai\@Ledų atsiradimas_ežerai,upės(versija2).xlsx`;

  // Generate backup file path with date and time
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-"); // Format timestamp for filename
  const backupExcelPath = path.join(
    path.dirname(excelFilePath),
    `@Ledų atsiradimas_ežerai,upės(versija2)_${timestamp}.xlsx`
  );

  // Check if the network file exists
  if (!fs.existsSync(networkExcelPath)) {
    console.error(`Network Excel file not found: ${networkExcelPath}`);
    return;
  }

  // Check if the local Excel file exists
  if (fs.existsSync(excelFilePath)) {
    console.log("Comparing local and network Excel files...");

    // Compute file hashes to compare
    const [localHash, networkHash] = await Promise.all([
      computeFileHash(excelFilePath),
      computeFileHash(networkExcelPath),
    ]);

    if (localHash !== networkHash) {
      console.log("Local and network Excel files differ. Creating backup...");

      // Rename the local file as a backup with timestamp
      await rename(excelFilePath, backupExcelPath);
      console.log(`Backup created: ${backupExcelPath}`);

      // Copy the network file to the local path
      await copyFile(networkExcelPath, excelFilePath);
      console.log(`Network file copied to: ${excelFilePath}`);
    } else {
      console.log("Local and network Excel files are identical. Proceeding...");
    }
  } else {
    console.log("Local Excel file not found. Copying from network...");
    await copyFile(networkExcelPath, excelFilePath);
    console.log(`Network file copied to: ${excelFilePath}`);
  }

  // Proceed with original logic
  if (!fs.existsSync(csvFolderPath)) {
    console.error(`CSV folder not found: ${csvFolderPath}`);
    return;
  }

  const today = new Date();
  const todayString = today.toISOString().split("T")[0];

  const csvFiles = fs
    .readdirSync(csvFolderPath)
    .filter(
      (file) =>
        file.endsWith(".csv") &&
        file.includes(todayString) &&
        /table_data_duom_lent_\d{4}-\d{2}-\d{2}\.csv/.test(file)
    );

  if (csvFiles.length === 0) {
    console.error(`No CSV files found with today's date (${todayString}).`);
    return;
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelFilePath);

  // (Original logic for updating Excel file from CSVs follows here...)
};

updateLedaiFileFromAllCSVs();

// const fs = require("fs");

// const path = require("path");
// const ExcelJS = require("exceljs");

// const updateLedaiFileFromAllCSVs = async () => {
//   const csvFolderPath = String.raw`C:\Users\agned\Desktop\Daily Hydro Situation\hydrological_data_reader`;
//   const excelFilePath = String.raw`C:\Users\agned\Documents\Darbo Dokumentai\HidroDuomenys\Ledui_vid_temp\@Ledų atsiradimas_ežerai,upės(versija2).xlsx`;

//   if (!fs.existsSync(csvFolderPath)) {
//     console.error(`CSV folder not found: ${csvFolderPath}`);
//     return;
//   }

//   if (!fs.existsSync(excelFilePath)) {
//     console.error(`Excel file not found: ${excelFilePath}`);
//     return;
//   }

//   const today = new Date();
//   const todayString = today.toISOString().split("T")[0];

//   const csvFiles = fs
//     .readdirSync(csvFolderPath)
//     .filter(
//       (file) =>
//         file.endsWith(".csv") &&
//         file.includes(todayString) &&
//         /table_data_duom_lent_\d{4}-\d{2}-\d{2}\.csv/.test(file)
//     );

//   if (csvFiles.length === 0) {
//     console.error(`No CSV files found with today's date (${todayString}).`);
//     return;
//   }

//   const workbook = new ExcelJS.Workbook();
//   await workbook.xlsx.readFile(excelFilePath);

//   for (const csvFile of csvFiles) {
//     const match = csvFile.match(
//       /table_data_duom_lent_(\d{4}-\d{2}-\d{2})\.csv/
//     );
//     if (!match) {
//       console.warn(`Skipping file: ${csvFile} (does not match date format).`);
//       continue;
//     }

//     const csvDate = match[1];
//     console.log(`Processing CSV file: ${csvFile} for date: ${csvDate}`);

//     const csvFilePath = path.join(csvFolderPath, csvFile);
//     const csvData = fs.readFileSync(csvFilePath, "utf8");
//     const csvRows = csvData.split("\n").map((row) => row.split(","));

//     const year = today.getFullYear();
//     const month = today.getMonth() + 1;
//     const isJanToApr = month >= 1 && month <= 4;

//     // Define two sets of mappings for D and E columns
//     const valuesToFetchD = isJanToApr
//       ? {
//           D51: 84,
//           D15: 85,
//           D19: 86,
//           D40: 87,
//           D30: 88,
//           D44: 89,
//           D47: 90,
//           D23: 91,
//           D3: 92,
//           D33: 93,
//           D41: 94,
//           D46: 95,
//           D48: 96,
//         }
//       : {
//           D51: 118,
//           D15: 119,
//           D19: 120,
//           D40: 121,
//           D30: 122,
//           D44: 123,
//           D47: 124,
//           D23: 125,
//           D3: 126,
//           D33: 127,
//           D41: 128,
//           D46: 129,
//           D48: 130,
//         };

//     const valuesToFetchE = isJanToApr
//       ? {
//           E51: 101,
//           E15: 102,
//           E19: 103,
//           E40: 104,
//           E30: 105,
//           E44: 106,
//           E47: 107,
//           E23: 108,
//           E3: 109,
//           E33: 110,
//           E41: 111,
//           E46: 112,
//           E48: 113,
//         }
//       : {
//           E51: 135,
//           E15: 136,
//           E19: 137,
//           E40: 138,
//           E30: 139,
//           E44: 140,
//           E47: 141,
//           E23: 142,
//           E3: 143,
//           E33: 144,
//           E41: 145,
//           E46: 146,
//           E48: 147,
//         };

//     const sheetName = `${year}_LA`;
//     const sheet = workbook.getWorksheet(sheetName);
//     if (!sheet) {
//       console.error(`Sheet '${sheetName}' not found.`);
//       continue;
//     }

//     const dateRow = isJanToApr ? 83 : 117;

//     let columnIndex = null;
//     sheet.getRow(dateRow).eachCell((cell, colNumber) => {
//       if (cell.value && !isNaN(Date.parse(cell.value))) {
//         const cellDate = new Date(cell.value);
//         if (cellDate.toISOString().split("T")[0] === csvDate) {
//           columnIndex = colNumber;
//         }
//       }
//     });

//     if (!columnIndex) {
//       console.error(
//         `Date '${csvDate}' not found in row ${dateRow} of sheet '${sheetName}'.`
//       );
//       continue;
//     }

//     // Update values for D columns
//     for (const [csvCell, targetRow] of Object.entries(valuesToFetchD)) {
//       const [colLetter, rowNumber] = [
//         csvCell[0],
//         parseInt(csvCell.substring(1), 10),
//       ];
//       const value = csvRows[rowNumber - 1]?.[colLetter.charCodeAt(0) - 65];

//       if (value) {
//         const targetCell = sheet.getCell(targetRow, columnIndex);
//         targetCell.value = parseFloat(value);
//         console.log(
//           `Updated ${targetCell.address} with value from ${csvCell}: ${value}`
//         );
//       } else {
//         console.warn(`Value not found for ${csvCell} in the CSV file.`);
//       }
//     }

//     // Update values for E columns
//     for (const [csvCell, targetRow] of Object.entries(valuesToFetchE)) {
//       const [colLetter, rowNumber] = [
//         csvCell[0],
//         parseInt(csvCell.substring(1), 10),
//       ];
//       const value = csvRows[rowNumber - 1]?.[colLetter.charCodeAt(0) - 65];

//       if (value) {
//         const targetCell = sheet.getCell(targetRow, columnIndex);
//         targetCell.value = parseFloat(value);
//         console.log(
//           `Updated ${targetCell.address} with value from ${csvCell}: ${value}`
//         );
//       } else {
//         console.warn(`Value not found for ${csvCell} in the CSV file.`);
//       }
//     }
//   }

//   await workbook.xlsx.writeFile(excelFilePath);
//   console.log(`Data successfully updated in '${excelFilePath}'.`);
// };

// updateLedaiFileFromAllCSVs();
