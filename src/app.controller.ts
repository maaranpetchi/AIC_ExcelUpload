import { Controller, HttpException, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import * as ExcelJS from 'exceljs';
import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
@Controller('excel')
export class AppController {
  constructor(private readonly appService: AppService, @Inject('PG_POOL') private readonly pool: Pool) { }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const sheets = workbook.worksheets;
      // Define the pattern to search for
      const pageIdPattern = /Page Id\*/i;
      const colIdPattern = /Col Id\*/i;

      sheets.forEach(async sheet => {

        if (sheet.name === "All Pages") {
          for (let rowIndex = 1; rowIndex <= sheet.lastRow.number; rowIndex++) {
            for (let colIndex = 1; colIndex <= sheet.lastColumn.number; colIndex++) {
              const cell = sheet.getCell(rowIndex, colIndex);
              if (cell.value && pageIdPattern.test(cell.value.toString())) {
                const pgcolumnValues = [];
                for (let rowIdx = 1; rowIdx <= sheet.lastRow.number; rowIdx++) {
                  const rowCell = sheet.getCell(rowIdx, colIndex);
                  const value = rowCell.value;
                  if (value !== null && value !== undefined) {
                    pgcolumnValues.push(value);
                  }
                }
                console.log(pgcolumnValues, "PgColumnValues");

                // Remove { richText: [ [Object], [Object] ] } objects from pgcolumnValues
                const filteredPgcolumnValues = pgcolumnValues.filter(value => {
                  return typeof value === 'string' || typeof value === 'number';
                });

                const filteredPageIdColumnValues = filteredPgcolumnValues.slice(1);
                console.log(filteredPageIdColumnValues, "filteredPgValues");
                for (const PG of filteredPageIdColumnValues) {
                  const checkPGQuery = {
                    text: `SELECT * FROM public."t-PG" WHERE "PG" = $1`,
                    values: [PG],
                  };
                  const result = await this.pool.query(checkPGQuery);
                  if (result.rows.length === 0) {
                    // Insert PG into t-PG table if it doesn't exist
                    const t_PGquery = {
                      text: `INSERT INTO public."t-PG" ("PG") VALUES ($1)`,
                      values: [PG],
                    };
                    await this.pool.query(t_PGquery);
                  } else {
                    // Update PG in t-PG table if it already exists
                    const updatePGQuery = {
                      text: `UPDATE public."t-PG" SET "PG" = $1 WHERE "PG" = $1`,
                      values: [PG],
                    };
                    await this.pool.query(updatePGQuery);
                  }
                }
              }
            }
          }
        }
        if (sheet.name === "All Cols") {
          for (let rowIndex = 1; rowIndex <= sheet.lastRow.number; rowIndex++) {
            for (let colIndex = 1; colIndex <= sheet.lastColumn.number; colIndex++) {
              const cell = sheet.getCell(rowIndex, colIndex);
              if (cell.value && colIdPattern.test(cell.value.toString())) {
                const colcolumnValues = [];
                for (let rowIdx = 1; rowIdx <= sheet.lastRow.number; rowIdx++) {
                  const rowCell = sheet.getCell(rowIdx, colIndex);
                  const value = rowCell.value;
                  if (value !== null && value !== undefined) {
                    colcolumnValues.push(value);
                  }
                }
                // Remove { richText: [ [Object], [Object] ] } objects from pgcolumnValues
                const filteredColColumnValues = colcolumnValues.filter(value => {
                  return typeof value === 'string' || typeof value === 'number';
                });

                const filteredColIdColumnValues = filteredColColumnValues.slice(1);
                console.log(filteredColIdColumnValues, "filteredColumnValues");
                for (const Col of filteredColIdColumnValues) {
                  const checkColQuery = {
                    text: `SELECT * FROM public."t-Col" WHERE "Col" = $1`,
                    values: [Col],
                  };
                  const result = await this.pool.query(checkColQuery);
                  if (result.rows.length === 0) {
                    // Insert Col into t-Col table if it doesn't exist
                    const t_Colquery = {
                      text: `INSERT INTO public."t-Col" ("Col") VALUES ($1)`,
                      values: [Col],
                    };
                    await this.pool.query(t_Colquery);
                  } else {
                    // Update Col in t-Col table if it already exists
                    const updateColQuery = {
                      text: `UPDATE public."t-Col" SET "Col" = $1 WHERE "Col" = $1`,
                      values: [Col],
                    };
                    await this.pool.query(updateColQuery);
                  }
                }
              }
            }
          }
        }
      });
      return { message: 'Excel file processed successfully' };
    } catch (error) {
      console.error(error);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}