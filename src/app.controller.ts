import { Controller, HttpException, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import * as ExcelJS from 'exceljs';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { constants } from './constants';
@Controller('excel')
export class AppController {
  constructor(
    @Inject('PG_POOL') private readonly pool: Pool
  ) {}
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
          //t-PG table
          if (sheet.name === constants.allPages) {
            // Process 'All Pages' sheet
            for (let sheetRowIndex = 1; sheetRowIndex <= sheet.lastRow.number; sheetRowIndex++) {
              for (let sheetColIndex = 1; sheetColIndex <= sheet.lastColumn.number; sheetColIndex++) {
                const cell = sheet.getCell(sheetRowIndex, sheetColIndex);
                if (cell.value && constants.pageIdPattern.test(cell.value.toString())) {
                  const pgcolumnValues = [];
                  for (let rowIdx = 1; rowIdx <= sheet.lastRow.number; rowIdx++) {
                    const rowCell = sheet.getCell(rowIdx, sheetColIndex);
                    const value = rowCell.value;
                    if (value !== null && value !== undefined) {
                      pgcolumnValues.push(value);
                    }
                  }
                  console.log(pgcolumnValues, "PgColumnValues");
                  // Here you can execute your PostgreSQL queries
                  // for (const PG of pgcolumnValues.slice(1)) {
                  //   const t_PGquery = {
                  //     text: `INSERT INTO public."t-PG" ("PG") VALUES ($1)`,
                  //     values: [PG],
                  //   };
                  //   await this.pool.query(t_PGquery);
                  // }
                }
              }
            }
          }
          //t-Col table
          if (sheet.name === constants.allcols) {
            // Process 'All Cols' sheet
            for (let sheetRowIndex = 1; sheetRowIndex <= sheet.lastRow.number; sheetRowIndex++) {
              for (let sheetColIndex = 1; sheetColIndex <= sheet.lastColumn.number; sheetColIndex++) {
                const cell = sheet.getCell(sheetRowIndex, sheetColIndex);
                if (cell.value && constants.colIdPattern.test(cell.value.toString())) {
                  const colcolumnValues = [];
                  for (let rowIdx = 1; rowIdx <= sheet.lastRow.number; rowIdx++) {
                    const rowCell = sheet.getCell(rowIdx, sheetColIndex);
                    const value = rowCell.value;
                    if (value !== null && value !== undefined) {
                      colcolumnValues.push(value);
                    }
                  }
                  console.log(colcolumnValues, "ColColumnValues");
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
          //t-Row table
          // Dynamically find the header row
          let headerRowIndex = -1;
          for (let i = 1; i <= sheet.lastRow.number; i++) {
            const row = sheet.getRow(i);
            for (let j = 1; j <= row.cellCount; j++) {
              const cell = row.getCell(j);
              if (cell.value && constants.rowIdPattern.test(cell.value.toString())) {
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
          // Process each column to find specific pattern in the header
          let rowPatternFound = false;
          for (let sheetColIndex = 1; sheetColIndex <= sheet.lastColumn.number; sheetColIndex++) {
            const cell = headerRow.getCell(sheetColIndex);
            // Check if the cell value matches your pattern for headers (e.g., 'Row*')
            if (cell.value && constants.rowIdPattern.test(cell.value.toString())) {
              rowPatternFound = true;
              const rowColumnValues = [];
              // Collect all values in the column starting from the row after header
              for (let rowIdx = headerRowIndex + 1; rowIdx <= sheet.lastRow.number; rowIdx++) {
                const rowCell = sheet.getCell(rowIdx, sheetColIndex);
                const value = rowCell.value;
                if (value !== null && value !== undefined) {
                  rowColumnValues.push(value);
                }
              }
              console.log(rowColumnValues);
              // Example PostgreSQL insertion code (uncomment and adjust as needed)
              // for (const rowValue of rowColumnValues) {
              //   const query = {
              //     text: `INSERT INTO public."t-Row" ("RowValue") VALUES ($1)`,
              //     values: [rowValue],
              //   };
              //   await this.pool.query(query);
              // }
            }
          }
          if (!rowPatternFound) {
            console.log(`Row pattern not found in any columns of sheet ${sheet.name}`);
          }
        }
      }
      return { message: 'Excel file processed successfully' };
    } catch (error) {
      console.error(error);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
