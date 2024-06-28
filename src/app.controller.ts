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
      const RowTypeToRowId: { [key: string]: string } = {};
      //--Row-Type values
      for (const sheet of sheets) {
        if (sheet.name === constants.allTokens) {
          const RowType: string[] = [];
          const RowId: string[] = [];
          let tokenColStartIndex = -1;
          let rowColIndex = -1;
          let headerRowIndex = -1;
          let rowTypeRowIndex = -1;
          let rowTypeColIndex = -1;

          // Dynamically find the header row
          for (let i = 1; i <= sheet.lastRow.number; i++) {
            const row = sheet.getRow(i);
            for (let j = 1; j <= row.cellCount; j++) {
              const cell = row.getCell(j);
              if (
                cell.value &&
                (constants.tokenPattern.test(cell.value.toString()) ||
                  constants.rowIdPattern.test(cell.value.toString()))
              ) {
                headerRowIndex = i;
                break;
              }
            }
            if (headerRowIndex !== -1) break;
          }

          if (headerRowIndex === -1) {
            console.log(`Header row not found in sheet ${sheet.name}`);
            continue; // Skip to the next sheet if header row is not found
          }

          // Find the columns for Token and Row in the header row
          const headerRow = sheet.getRow(headerRowIndex);
          for (
            let sheetColIndex = 1;
            sheetColIndex <= sheet.lastColumn.number;
            sheetColIndex++
          ) {
            const cell = headerRow.getCell(sheetColIndex);

            if (
              cell.value &&
              constants.tokenPattern.test(cell.value.toString())
            ) {
              tokenColStartIndex = sheetColIndex;
            }
            if (
              cell.value &&
              constants.rowIdPattern.test(cell.value.toString())
            ) {
              rowColIndex = sheetColIndex;
            }

            // Break early if both indices are found
            if (tokenColStartIndex !== -1 && rowColIndex !== -1) break;
          }

          if (tokenColStartIndex === -1 || rowColIndex === -1) {
            console.log(`Token or Row column not found in sheet ${sheet.name}`);
            continue; // Skip to the next sheet if headers are not found
          }

          // Identify the RowType row dynamically
          for (let i = headerRowIndex + 1; i <= sheet.lastRow.number; i++) {
            const row = sheet.getRow(i);
            for (let j = 1; j <= row.cellCount; j++) {
              const cell = row.getCell(j);
              if (cell.value && constants.rowType.test(cell.value.toString())) {
                rowTypeRowIndex = i;
                rowTypeColIndex = j;
                break;
              }
            }
            if (rowTypeRowIndex !== -1 && rowTypeColIndex !== -1) break;
          }

          if (rowTypeRowIndex === -1) {
            console.log(`RowType row not found in sheet ${sheet.name}`);
            continue; // Skip to the next sheet if RowType row is not found
          }

          // Collect values under Token and Row headers
          let currentTokenValue = null;
          for (
            let rowIdx = rowTypeRowIndex + 1;
            rowIdx <= sheet.lastRow.number;
            rowIdx++
          ) {
            // Start from the row after RowType
            const tokenCell = sheet.getCell(rowIdx, rowTypeColIndex + 1); // Start from the cell after RowTypeCol

            if (tokenCell.value === null || tokenCell.value === undefined) {
              break; // Stop if token cell is null or undefined
            }

            currentTokenValue = tokenCell.value.toString();

            const rowCell = sheet.getCell(rowIdx, rowColIndex);
            const rowValue = rowCell.value;

            if (rowValue !== null && rowValue !== undefined) {
              RowType.push(currentTokenValue);
              RowId.push(rowValue.toString());
            }
          }

          // Create key-value pairs with RowType as key and RowId as value
          for (let i = 0; i < RowType.length; i++) {
            RowTypeToRowId[RowType[i]] = RowId[i];
          }

          console.log('Row-Type:', RowTypeToRowId);
        }
      }

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
            // for (const PG of pageIds.slice(1)) {
            // const t_PGquery = {
            // text: INSERT INTO public."t-PG" ("PG") VALUES ($1),
            // values: [PG], // };
            // await this.pool.query(t_PGquery);
            // }
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
                  // for (const Col of colcolumnValues.slice(1)) {
                  //   const t_Colquery = {
                  //     text: `INSERT INTO public."t-Col" ("Col") VALUES ($1)`,
                  //     values: [Col],
                  //   };
                  //   await this.pool.query(t_Colquery);
                  // }
                }
              }
            }
          }
//--t-Row table
if (sheet.name in pageIdToNameMap) {
  var pageId = pageIdToNameMap[sheet.name];
  //console.log("Page-ID is ", pageId);
}

// Dynamically find the header row for Row-ID and Row-Type
let headerRowIndex = -1;
for (let i = 1; i <= sheet.lastRow.number; i++) {
  const row = sheet.getRow(i);
  for (let j = 1; j <= row.cellCount; j++) {
    const cell = row.getCell(j);
    // Check if the cell value matches RowType
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
let rowTypeColumnIndex = -1;
let nestedColumnStartIndex = -1;
let nestedColumnEndIndex = -1;
let nestedColumn = constants.nestedColumns[sheet.name];

for (let sheetColIndex = 1; sheetColIndex <= sheet.lastColumn.number; sheetColIndex++) {
  const cell = headerRow.getCell(sheetColIndex);
  if (cell.value) {
    if (constants.rowIdPattern.test(cell.value.toString())) {
      rowIdColumnIndex = sheetColIndex;
    } else if (constants.rowType.test(cell.value.toString())) {
      rowTypeColumnIndex = sheetColIndex;
    } else if (nestedColumn && new RegExp(nestedColumn, 'i').test(cell.value.toString())) {
      if (nestedColumnStartIndex === -1) {
        nestedColumnStartIndex = sheetColIndex;
      }
      nestedColumnEndIndex = sheetColIndex;
    }
  }
}

if (rowTypeColumnIndex === -1) {
  console.log(`Row-Type column not found in sheet ${sheet.name}`);
  continue; // Skip to the next sheet
}

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

  if (isRowEmpty) {
    continue; // Skip the empty row
  }

  const rowIdCell = rowIdColumnIndex !== -1 ? sheet.getCell(rowIdx, rowIdColumnIndex) : null;
  const rowTypeCell = sheet.getCell(rowIdx, rowTypeColumnIndex);
  const rowValue = rowIdCell ? rowIdCell.value : null;
  const rowTypeValue = rowTypeCell ? rowTypeCell.value : null;

  // Check if rowIdPattern exists but no row value is found, skip this row
  if (rowIdColumnIndex !== -1 && (rowValue === null || rowValue === undefined)) {
    continue;
  }

  let rowLevel = 1; // Default row level is 1

  if (rowTypeValue !== null && rowTypeValue !== undefined && rowTypeValue.toString() === 'Section-Head') {
    rowLevel = 0;
  } else if (nestedColumnStartIndex !== -1 && nestedColumnEndIndex !== -1) {
    // Calculate rowLevel for non-section-head rows and even if rowType is null
    for (let colIdx = nestedColumnStartIndex; colIdx <= nestedColumnEndIndex; colIdx++) {
      const cell = sheet.getCell(rowIdx, colIdx);
      if (cell.value) {
        rowLevel = colIdx - nestedColumnStartIndex + 1;
        break;
      }
    }
  }

  if (rowValue !== null && rowValue !== undefined) {
    if (rowTypeValue !== null && rowTypeValue !== undefined) {
      if (rowTypeValue.toString() in RowTypeToRowId) {
        var rowTypeId = RowTypeToRowId[rowTypeValue.toString()];
        console.log(
          `Row: ${rowValue}, PG: ${pageId}, Row-Type: ${rowTypeId}, Row-Level: ${rowLevel}`,
        );
        // Insert into t-Row table
        // const query = {
        //   text: 'INSERT INTO public."t-Row" ("Row", "PG", "Share", "Inherit", "Row-Type", "Row-Level") VALUES ($1, $2, $3, $4, $5, $6)',
        //   values: [rowValue, pageId, null, null, rowTypeId, rowLevel],
        // };
        // await this.pool.query(query);
      } else {
        console.log(
          `Row: ${rowValue}, PG: ${pageId}, Row-Type: null, Row-Level: ${rowLevel}`,
        ); // Row-Type not found in mapping
        // Insert into t-Row table with null Row-Type
        // const query = {
        //   text: 'INSERT INTO public."t-Row" ("Row", "PG", "Share", "Inherit", "Row-Type", "Row-Level") VALUES ($1, $2, $3, $4, $5, $6)',
        //   values: [rowValue, pageId, null, null, null, rowLevel],
        // };
        // await this.pool.query(query);
      }
    } else {
      console.log(
        `Row: ${rowValue}, PG: ${pageId}, Row-Type: null, Row-Level: ${rowLevel}`,
      ); // Row-Type is null
      // Insert into t-Row table with null Row-Type
      // const query = {
      //   text: 'INSERT INTO public."t-Row" ("Row", "PG", "Share", "Inherit", "Row-Type", "Row-Level") VALUES ($1, $2, $3, $4, $5, $6)',
      //   values: [rowValue, pageId, null, null, null, rowLevel],
      // };
      // await this.pool.query(query);
    }
  } else {
    if (rowTypeValue !== null && rowTypeValue !== undefined) {
      if (rowTypeValue.toString() in RowTypeToRowId) {
        var rowTypeId = RowTypeToRowId[rowTypeValue.toString()];
        console.log(
          `PG: ${pageId}, Row-Type: ${rowTypeId}, Row-Level: ${rowLevel}`,
        );
        // Insert into t-Row table
        // const query = {
        //   text: 'INSERT INTO public."t-Row" ("PG", "Row-Type", "Row-Level") VALUES ($1, $2, $3)',
        //   values: [pageId, rowTypeId, rowLevel],
        // };
        // await this.pool.query(query);
      } else {
        console.log(
          `PG: ${pageId}, Row-Type: null, Row-Level: ${rowLevel}`,
        ); // Row-Type not found in mapping
        // Insert into t-Row table with null Row-Type
        // const query = {
        //   text: 'INSERT INTO public."t-Row" ("PG", "Row-Type", "Row-Level") VALUES ($1, $2, $3)',
        //   values: [pageId, null, rowLevel],
        // };
        // await this.pool.query(query);
      }
    } else {
      console.log(
        `PG: ${pageId}, Row-Type: null, Row-Level: ${rowLevel}`,
      ); // Both Row and Row-Type are null
      // Insert into t-Row table with null Row-Type
      // const query = {
      //   text: 'INSERT INTO public."t-Row" ("PG", "Row-Type", "Row-Level") VALUES ($1, $2, $3)',
      //   values: [pageId, null, rowLevel],
      // };
      // await this.pool.query(query);
    }
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
