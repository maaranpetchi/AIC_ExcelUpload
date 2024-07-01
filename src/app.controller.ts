import {
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import * as ExcelJS from 'exceljs';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { constants } from './constants';
@Controller('excel')
export class AppController {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const sheets = workbook.worksheets;

      for (const sheet of sheets) {
        if (constants.sheetNames.includes(sheet.name)) {
          console.log(`Processing sheet: ${sheet.name}`);
          //--t-PG table
          if (sheet.name === constants.allPages) {
            // Initialize arrays to store page IDs and names
            const pageIds: string[] = [];
            const pageNames: string[] = [];

            // Iterate through each cell in the sheet
            for (
              let sheetRowIndex = 1;
              sheetRowIndex <= sheet.lastRow.number;
              sheetRowIndex++
            ) {
              for (
                let sheetColIndex = 1;
                sheetColIndex <= sheet.lastColumn.number;
                sheetColIndex++
              ) {
                const cell = sheet.getCell(sheetRowIndex, sheetColIndex);

                // Check for page ID pattern and populate pageIds array
                if (
                  cell.value &&
                  constants.pageIdPattern.test(cell.value.toString())
                ) {
                  for (
                    let rowIdx = 1;
                    rowIdx <= sheet.lastRow.number;
                    rowIdx++
                  ) {
                    const rowCell = sheet.getCell(rowIdx, sheetColIndex);
                    const value = rowCell.value;
                    if (value !== null && value !== undefined) {
                      pageIds.push(value.toString());
                    }
                  }
                }

                // Check for page name pattern and populate pageNames array
                if (
                  cell.value &&
                  constants.pageNamePattern.test(cell.value.toString())
                ) {
                  for (
                    let rowIdx = 1;
                    rowIdx <= sheet.lastRow.number;
                    rowIdx++
                  ) {
                    const rowCell = sheet.getCell(rowIdx, sheetColIndex);
                    const value = rowCell.value;
                    if (value !== null && value !== undefined) {
                      pageNames.push(value.toString());
                    }
                  }
                }
              }
            }

            // Generate INSERT query to push into t-PG table
              for (const PG of pageIds.slice(1)) {
              const t_PGquery = {
              text: `INSERT INTO public."t-PG" ("PG") VALUES ($1)`,
              values: [PG],
             };
              await this.pool.query(t_PGquery);
              }
            console.log('Page ID', pageIds);

            // Alternatively, create a key-value pair of page ID and page name
            var pageIdToNameMap: { [pageName: string]: string } = {};
            for (let i = 0; i < pageIds.length; i++) {
              pageIdToNameMap[pageNames[i]] = pageIds[i];
            }

            console.log('Page ID to Name Map:', pageIdToNameMap);
          }

          //--t-Col table
          if (sheet.name === constants.allcols) {
            // Process 'All Cols' sheet
            for (
              let sheetRowIndex = 1;
              sheetRowIndex <= sheet.lastRow.number;
              sheetRowIndex++
            ) {
              for (
                let sheetColIndex = 1;
                sheetColIndex <= sheet.lastColumn.number;
                sheetColIndex++
              ) {
                const cell = sheet.getCell(sheetRowIndex, sheetColIndex);
                if (
                  cell.value &&
                  constants.colIdPattern.test(cell.value.toString())
                ) {
                  const colcolumnValues = [];
                  for (
                    let rowIdx = 1;
                    rowIdx <= sheet.lastRow.number;
                    rowIdx++
                  ) {
                    const rowCell = sheet.getCell(rowIdx, sheetColIndex);
                    const value = rowCell.value;
                    if (value !== null && value !== undefined) {
                      colcolumnValues.push(value);
                    }
                  }
                  console.log(colcolumnValues, 'ColColumnValues');
                  // Here you can execute your PostgreSQL queries
                  for (const Col of colcolumnValues.slice(1)) {
                    const t_Colquery = {
                      text: `INSERT INTO public."t-Col" ("Col") VALUES ($1)`,
                      values: [Col],
                    };
                    await this.pool.query(t_Colquery);
                  }
                }
              }
            }
          }

          if (sheet.name in pageIdToNameMap) {
            var pageId = pageIdToNameMap[sheet.name];
          }

// Ensure pageId exists in the referenced table
const checkPageIdQuery = {
  text: 'SELECT 1 FROM public."t-PG" WHERE "PG" = $1',
  values: [pageId],
};

try {
  const res = await this.pool.query(checkPageIdQuery);
  if (res.rowCount === 0) {
    console.error(`Page-ID ${pageId} does not exist in the referenced table`);
    continue; // Skip to the next sheet
  }
} catch (err) {
  console.error(`Error checking Page-ID: ${err}`);
  continue; // Skip to the next sheet
}

// Dynamically find the header row for Row-ID and Row-Type
let headerRowIndex = -1;
for (let i = 1; i <= sheet.lastRow.number; i++) {
  const row = sheet.getRow(i);
  for (let j = 1; j <= row.cellCount; j++) {
    const cell = row.getCell(j);
    if (cell.value && constants.rowType.test(cell.value.toString())) {
      headerRowIndex = i;
      break;
    }
  }
  if (headerRowIndex !== -1) break;
}

if (headerRowIndex === -1) {
  console.log(`Header row not found in sheet ${sheet.name}`);
  continue; // Skip to the next sheet
}

const headerRow = sheet.getRow(headerRowIndex);

// Identify Row-ID, Row-Type, and nested columns
let rowIdColumnIndex = -1;
let rowStatusColumnIndex = -1;
let nestedColumnStartIndex = -1;
let nestedColumnEndIndex = -1;
let nestedColumn = constants.nestedColumns[sheet.name];

for (let sheetColIndex = 1; sheetColIndex <= sheet.lastColumn.number; sheetColIndex++) {
  const cell = headerRow.getCell(sheetColIndex);
  if (cell.value) {
    if (constants.rowIdPattern.test(cell.value.toString())) {
      rowIdColumnIndex = sheetColIndex;
    } else if (constants.rowStatus.test(cell.value.toString())) {
      rowStatusColumnIndex = sheetColIndex;
    } else if (nestedColumn && new RegExp(nestedColumn, 'i').test(cell.value.toString())) {
      if (nestedColumnStartIndex === -1) {
        nestedColumnStartIndex = sheetColIndex;
      }
      nestedColumnEndIndex = sheetColIndex;
    }
  }
}

if (rowStatusColumnIndex === -1) {
  console.log(`Row-Status column not found in sheet ${sheet.name}`);
  continue; // Skip to the next sheet
}

// Array to keep track of previous rows' info for parent and sibling calculations
let previousRows = [];

// Object to keep track of the last row at each level and parent combination
let lastRowAtLevel = {};

// Process rows
for (let rowIdx = headerRowIndex + 1; rowIdx <= sheet.lastRow.number; rowIdx++) {
  const row = sheet.getRow(rowIdx);

  // Check if the row is empty
  let isRowEmpty = true;
  for (let colIdx = 1; colIdx <= row.cellCount; colIdx++) {
    const cell = row.getCell(colIdx);
    if (cell.value !== null && cell.value !== undefined && cell.value.toString().trim() !== '') {
      isRowEmpty = false;
      break;
    }
  }

  // Skip entirely empty rows
  if (isRowEmpty) {
    continue;
  }

  const rowIdCell = rowIdColumnIndex !== -1 ? row.getCell(rowIdColumnIndex) : null;
  const rowStatusCell = row.getCell(rowStatusColumnIndex);
  const rowValue = rowIdCell ? rowIdCell.value : null;
  const rowStatusValue = rowStatusCell ? rowStatusCell.value : null;

  // Skip rows with Row column but no Row value
  if (rowIdColumnIndex !== -1 && (rowValue === null || rowValue === undefined)) {
    continue;
  }

  let rowLevel = 1; // Default row level is 1

  if (rowStatusValue !== null && rowStatusValue !== undefined && rowStatusValue.toString() === constants.sectionHead) {
    rowLevel = 0;
  } else if (nestedColumnStartIndex !== -1 && nestedColumnEndIndex !== -1) {
    // Calculate rowLevel for non-section-head rows and even if rowType is null
    for (let colIdx = nestedColumnStartIndex; colIdx <= nestedColumnEndIndex; colIdx++) {
      const cell = row.getCell(colIdx);
      if (cell.value) {
        rowLevel = colIdx - nestedColumnStartIndex + 1;
        break;
      }
    }
  }

  let parentRowId = null;
  let siblingRowId = null;

  // Determine parent-Row ID
  for (let i = previousRows.length - 1; i >= 0; i--) {
    if (previousRows[i].rowLevel < rowLevel) {
      parentRowId = previousRows[i].id;
      break;
    }
  }

  // Determine sibling-Row ID
  const lastRowKey = `${parentRowId}-${rowLevel}`;
  if (lastRowAtLevel[lastRowKey]) {
    siblingRowId = lastRowAtLevel[lastRowKey].id;
  }

  // Insert the current row and get the auto-generated ID
  let newRowId = null;
  let query;
  if (rowValue !== null && rowValue !== undefined) {
    query = {
      text: `INSERT INTO public."t-Row" ("Row", "PG", "Share", "Inherit", "Row-Level", "Parent-Row", "Sibling-Row") 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING "Row"`,
      values: [
        rowValue,
        pageId,
        null,
        null,
        rowLevel,
        parentRowId,
        siblingRowId,
      ],
    };
  } else {
    query = {
      text: `INSERT INTO public."t-Row" ("PG", "Share", "Inherit", "Row-Level", "Parent-Row", "Sibling-Row") 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING "Row"`,
      values: [
        pageId,
        null,
        null,
        rowLevel,
        parentRowId,
        siblingRowId,
      ],
    };
  }

  try {
    const res = await this.pool.query(query);
    newRowId = res.rows[0].Row;

    // Update the sibling-Row of the previous row at the same level
    if (siblingRowId !== null) {
      const updateSiblingQuery = {
        text: 'UPDATE public."t-Row" SET "Sibling-Row" = $1 WHERE "Row" = $2',
        values: [newRowId, siblingRowId],
      };
      try {
        await this.pool.query(updateSiblingQuery);
        console.log(`Updated Sibling-Row for Row ID ${siblingRowId} to ${newRowId}`);
      } catch (err) {
        console.error(`Error updating sibling row: ${err}`);
      }
    }

    // Log the inserted row
    if (rowValue !== null && rowValue !== undefined) {
      console.log(
        `Row: ${rowValue}, PG: ${pageId}, Row-Level: ${rowLevel}, Parent-Row: ${parentRowId}, Sibling-Row: ${siblingRowId}`,
      );
    } else {
      console.log(
        `PG: ${pageId}, Row-Level: ${rowLevel}, Parent-Row: ${parentRowId}, Sibling-Row: ${siblingRowId}`,
      );
    }

    // Add current row info to previousRows array
    previousRows.push({ id: newRowId, rowValue, rowLevel, parentRowId, siblingRowId });

    // Update the last row at this level and parent combination
    lastRowAtLevel[lastRowKey] = { id: newRowId, rowValue, rowLevel, parentRowId };

  } catch (err) {
    console.error(`Error inserting row: ${err}`);
    continue; // Skip to the next row in case of error
  }
}

// Update sibling-Row for the last row in each level
for (let key in lastRowAtLevel) {
  const row = lastRowAtLevel[key];
  const updateQuery = {
    text: 'UPDATE public."t-Row" SET "Sibling-Row" = NULL WHERE "Row" = $1',
    values: [row.id],
  };
  try {
    await this.pool.query(updateQuery);
    console.log(`Set Sibling-Row to NULL for Row ID ${row.id}`);
  } catch (err) {
    console.error(`Error setting Sibling-Row to NULL: ${err}`);
  }
}
        }
      }
      return { message: 'Excel file processed successfully' };
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
