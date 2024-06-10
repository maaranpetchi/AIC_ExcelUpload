import { Controller, HttpException, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import * as ExcelJS from 'exceljs';
import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { log } from 'console';

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

      console.log(sheets, "Sheets");

      // Loop through each sheet
      sheets.forEach(async (sheet) => {
        console.log(`Sheet name: ${sheet.name}`);

        // Read the first column (PageId) from the first sheet
        if (sheet.name === 'All Pages') {
          const PGS = [];
          for (let row = 4; row <= sheet.rowCount; row++) {
            const cell = sheet.getCell(`C${row}`);
            if (cell.value!== null && cell.value!== undefined) {
              PGS.push(cell.value);
            }
          }
          console.log(`PG: ${PGS}`);

          // Insert PG into t_pg table
          for (const PG of PGS) {
            console.log(PG,"pgValue");
            
            const query = {
              text: `INSERT INTO public."t-PG" ("PG") VALUES ($1)`,
              values: [PG],
            };
            await this.pool.query(query);
          }
        }
      });

      // Return a success response
      return { message: 'Excel file uploaded successfully' };
    } catch (error) {
      console.error(error);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}