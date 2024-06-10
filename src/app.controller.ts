import { Controller, HttpException, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import * as ExcelJS from 'exceljs';

@Controller('excel')
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);

      const sheets = workbook.worksheets;

      console.log(sheets, "Sheets");

      // Loop through each sheet
      sheets.forEach((sheet) => {
        console.log(`Sheet name: ${sheet.name}`);

        // Read the first column (PageId) from the first sheet
        if (sheet.name === 'All Pages') {
          const pageIds = [];
          for (let row = 4; row <= sheet.rowCount; row++) {
            const cell = sheet.getCell(`C${row}`);
            if (cell.value !== null && cell.value !== undefined) {
              pageIds.push(cell.value);
            }
          }
          console.log(`PageIds: ${pageIds}`);
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