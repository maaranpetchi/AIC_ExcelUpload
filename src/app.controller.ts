import { Controller, HttpException, HttpStatus, Logger, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import * as ExcelJS from 'exceljs';
import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { log } from 'console';
import { TextEncoderStream } from 'node:stream/web';
@Controller('excel')
export class AppController {
  SheetPageId: any;
  setSheetPageId: any;
  setSheetPageName: string;
  constructor(private readonly appService: AppService, @Inject('PG_POOL') private readonly pool: Pool) { }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      const workbook = new ExcelJS.Workbook(); ``
      await workbook.xlsx.load(file.buffer);
      const sheets = workbook.worksheets;
      // Loop through each sheet
      sheets.forEach(async (sheet) => {
        if (sheet.name === 'All Pages') {
          const PGS = [];
          for (let row = 4; row <= sheet.rowCount; row++) {
            const cell = sheet.getCell(`C${row}`);
            if (cell.value !== null && cell.value !== undefined) {
              PGS.push(cell.value);
            }
          }
          // Check if PG already exists in t-PG table
          for (const PG of PGS) {
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
            }
          }
        }
        if (sheet.name === 'All Cols') {
          //          //          //          console.log("ALL COLS");
          const Cols = [];
          for (let row = 4; row <= sheet.rowCount; row++) {
            const cell = sheet.getCell(`C${row}`);
            if (cell.value !== null && cell.value !== undefined) {
              Cols.push(cell.value);
            }
          }
          // Check if Col already exists in t-Col table
          for (const Col of Cols) {
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
            }
          }
        }
        const b1Cell = sheet.getCell('B1');
        if (b1Cell.value && typeof b1Cell.value === 'object' && 'richText' in b1Cell.value) {
          const richTextValue = b1Cell.value as ExcelJS.CellRichTextValue;
          const PageName = richTextValue.richText.slice(1).map((item) => item.text).join('');
          if ((PageName === sheet.name) && (sheet.name !== "All Profiles") && (sheet.name !== "All Cats") && (PageName !== "All Profiles") && (PageName !== "All Cats")) {
            //          console.log(sheet.name, "SheetName");
            //          console.log(PageName,"PageName");
            if (PageName === sheet.name) {
              const b3Cell = sheet.getCell('B3');
              //            console.log(b3Cell.value,"B3CellValue");
              if (b3Cell.value && b3Cell.value.toString().startsWith('Row*')) {
                //              console.log(b3Cell.value, "Matched Value");
                const bCells = [];
                for (let row = 4; row <= sheet.rowCount; row++) {
                  const bCell = sheet.getCell(`B${row}`);
                  if (bCell.value !== null && bCell.value !== undefined) {
                    if (typeof bCell.value === 'object' && 'richText' in bCell.value) {
                      const text = bCell.value.richText.map(rt => rt.text).join('');
                      bCells.push(text);
                    } else {
                      bCells.push(bCell.value);
                    }
                  }
                }
                console.log(PageName,"Page Name");
                console.log(bCells, "B Cells Data");
                // Add your code here to process the B cells data
              }
            }
          }
        }
      }
      );
      // Return a success response
      return { message: 'Excel file uploaded successfully' };
    } catch (error) {
      console.error(error);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}