const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const updateLedaiFile = async () => {
  const csvFilePath = String.raw`C:\Users\agned\Desktop\Daily Hydro Situation\hydrological_data_reader\table_data_duom_lent.csv`;
  const excelFilePath = String.raw`C:\Users\agned\Documents\Darbo Dokumentai\HidroDuomenys\Ledui_vid_temp\@Ledų atsiradimas_ežerai,upės.xlsx`;

  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`);
    return;
  }
  if (!fs.existsSync(excelFilePath)) {
    console.error(`Excel file not found: ${excelFilePath}`);
    return;
  }

  const csvData = fs.readFileSync(csvFilePath, "utf8");
  const csvRows = csvData.split("\n").map((row) => row.split(","));

  // Get today's date
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // Month is 0-based, so +1
  const targetDateISO = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD

  // Determine the target rows based on the date
  const isJanToApr = month >= 1 && month <= 4;
  const valuesToFetch = isJanToApr
    ? {
        D51: 84,
        D15: 85,
        D19: 86,
        D40: 87,
        D30: 88,
        D44: 89,
        D47: 90,
        D23: 91,
        D3: 92,
        D33: 93,
        D41: 94,
        D46: 95,
        D48: 96,
      }
    : {
        D51: 104,
        D15: 105,
        D19: 106,
        D40: 107,
        D30: 108,
        D44: 109,
        D47: 110,
        D23: 111,
        D3: 112,
        D33: 113,
        D41: 114,
        D46: 115,
        D48: 116,
      };

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelFilePath);

  const sheetName = `${year}_LA`;
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    console.error(`Sheet '${sheetName}' not found.`);
    return;
  }

  // Determine the column based on today's date
  const dateRow = isJanToApr ? 83 : 103; // Row for date comparison
  console.log(
    `Searching for date '${targetDateISO}' in row ${dateRow} of sheet '${sheetName}'`
  );

  let columnIndex = null;
  sheet.getRow(dateRow).eachCell((cell, colNumber) => {
    if (cell.value && !isNaN(Date.parse(cell.value))) {
      const cellDate = new Date(cell.value);
      if (cellDate.toISOString().split("T")[0] === targetDateISO) {
        columnIndex = colNumber;
      }
    }
    console.log(`Checking column ${colNumber}, value:`, cell.value);
  });

  if (!columnIndex) {
    console.error(
      `Date '${targetDateISO}' not found in row ${dateRow} of sheet '${sheetName}'.`
    );
    return;
  }

  // Update the Excel sheet with data from the CSV
  for (const [csvCell, targetRow] of Object.entries(valuesToFetch)) {
    const [colLetter, rowNumber] = [
      csvCell[0],
      parseInt(csvCell.substring(1), 10),
    ];
    const value = csvRows[rowNumber - 1]?.[colLetter.charCodeAt(0) - 65];

    if (value) {
      const targetCell = sheet.getCell(targetRow, columnIndex);
      targetCell.value = parseFloat(value);
      console.log(
        `Updated ${targetCell.address} with value from ${csvCell}: ${value}`
      );
    } else {
      console.warn(`Value not found for ${csvCell} in the CSV file.`);
    }
  }

  await workbook.xlsx.writeFile(excelFilePath);
  console.log(
    `Data successfully updated in '${excelFilePath}' on sheet '${sheetName}'.`
  );
};

updateLedaiFile();
