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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { constants } from './constants';
import { TPg } from './entities/TPg';
import { TCol } from './entities/TCol';
import { TRow } from './entities/TRow';

@Controller('excel')
export class AppController {
  constructor(
    @InjectRepository(TPg) private readonly tpgRepository: Repository<TPg>,
    @InjectRepository(TCol) private readonly tColRepository: Repository<TCol>,
    @InjectRepository(TRow) private readonly tRowRepository: Repository<TRow>,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const sheets = workbook.worksheets;
      const pageIdToNameMap: { [pageName: string]: string } = {};
      //--Col Id to Col name mapping
      const colData = {}; // Object to store Col ID, Page Type, Page ID, and Col Name

      // Process the 'All Cols' sheet first
      const allColsSheet = sheets.find(
        (sheet) => sheet.name === constants.allcols,
      );
      if (!allColsSheet) {
        throw new Error(constants.allcolsError);
      }

      let colIdIndex = constants.index;
      let pageTypeIndex = constants.index;
      let pageIdIndex = constants.index;
      let colNameIndex = constants.index;
      let headerRowIndex = constants.index;

      // Find the indices of the headers
      for (
        let rowIndex = constants.one;
        rowIndex <= allColsSheet.lastRow.number;
        rowIndex++
      ) {
        const row = allColsSheet.getRow(rowIndex);
        for (
          let colIndex = constants.one;
          colIndex <= row.cellCount;
          colIndex++
        ) {
          const cellValue = row.getCell(colIndex).value?.toString();
          if (cellValue && constants.colIdPattern.test(cellValue)) {
            colIdIndex = colIndex;
            headerRowIndex = rowIndex;
          }
          if (cellValue && constants.pageTypePattern.test(cellValue)) {
            pageTypeIndex = colIndex;
            headerRowIndex = rowIndex;
          }
          if (cellValue && constants.pageIdPattern.test(cellValue)) {
            pageIdIndex = colIndex;
            headerRowIndex = rowIndex;
          }
          if (cellValue && constants.colNamePattern.test(cellValue)) {
            colNameIndex = colIndex;
            headerRowIndex = rowIndex;
          }
        }
        if (headerRowIndex !== constants.index) break; // Exit the loop once the header is found
      }

      if (
        colIdIndex === constants.index ||
        pageTypeIndex === constants.index ||
        pageIdIndex === constants.index ||
        colNameIndex === constants.index
      ) {
        throw new Error(constants.headerError);
      }

      // Read the data under the headers and store it in the object
      for (
        let rowIndex = headerRowIndex + constants.one;
        rowIndex <= allColsSheet.lastRow.number;
        rowIndex++
      ) {
        const row = allColsSheet.getRow(rowIndex);
        const colId = row.getCell(colIdIndex).value?.toString();
        const pageType = row.getCell(pageTypeIndex).value?.toString();
        const pageId = row.getCell(pageIdIndex).value?.toString();
        const colName = row.getCell(colNameIndex).value?.toString();
        if (colId && colName) {
          colData[colId] = {
            pageType,
            pageId,
            colName,
          };
        }
      }

      console.log('Col Data:', colData);

      for (const sheet of sheets) {
        if (constants.sheetNames.includes(sheet.name)) {
          console.log(`Processing sheet: ${sheet.name}`);

          // Process 'All Pages' sheet
          if (sheet.name === constants.allPages) {
            // Initialize arrays to store page IDs and names
            const pageIds: string[] = [];
            const pageNames: string[] = [];

            // Iterate through each cell in the sheet
            for (
              let sheetRowIndex = constants.one;
              sheetRowIndex <= sheet.lastRow.number;
              sheetRowIndex++
            ) {
              for (
                let sheetColIndex = constants.one;
                sheetColIndex <= sheet.lastColumn.number;
                sheetColIndex++
              ) {
                const cell = sheet.getCell(sheetRowIndex, sheetColIndex);

                // Check for page ID pattern and populate pageIds array
                if (
                  cell.value &&
                  constants.pageIdMandatoryPattern.test(cell.value.toString())
                ) {
                  for (
                    let rowIdx = constants.one;
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
                    let rowIdx = constants.one;
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

            // Save page IDs into the 't-PG' table
            for (const PG of pageIds.slice(constants.one)) {
              const tpgEntity = this.tpgRepository.create({ pg: PG });
              await this.tpgRepository.save(tpgEntity);
            }

            // Create a key-value pair of page ID and page name
            for (let i = constants.zero; i < pageIds.length; i++) {
              pageIdToNameMap[pageNames[i]] = pageIds[i];
            }
          }

          // Process 'All Cols' sheet
          if (sheet.name === constants.allcols) {
            for (
              let sheetRowIndex = constants.one;
              sheetRowIndex <= sheet.lastRow.number;
              sheetRowIndex++
            ) {
              for (
                let sheetColIndex = constants.one;
                sheetColIndex <= sheet.lastColumn.number;
                sheetColIndex++
              ) {
                const cell = sheet.getCell(sheetRowIndex, sheetColIndex);
                if (
                  cell.value &&
                  constants.colIdPattern.test(cell.value.toString())
                ) {
                  const colColumnValues = [];
                  for (
                    let rowIdx = constants.one;
                    rowIdx <= sheet.lastRow.number;
                    rowIdx++
                  ) {
                    const rowCell = sheet.getCell(rowIdx, sheetColIndex);
                    const value = rowCell.value;
                    if (value !== null && value !== undefined) {
                      colColumnValues.push(value);
                    }
                  }
                  // Save col values into 't-Col' table
                  for (const Col of colColumnValues.slice(constants.one)) {
                    const newColEntity = this.tColRepository.create({
                      col: Col,
                    });
                    await this.tColRepository.save(newColEntity);
                  }
                }
              }
            }
          }

          // Check if sheet name is a key in pageIdToNameMap
          if (sheet.name in pageIdToNameMap) {
            var pageId = pageIdToNameMap[sheet.name];
          }

          // Find existing page in 't-PG' table
          const existingPage = await this.tpgRepository.findOne({
            where: { pg: pageId },
          });
          if (!existingPage) {
            console.error(pageId + constants.pageIdError);
            continue;
          }

          // Find header row index based on specific constants
          let headerRowIndex = constants.index;
          for (let i = constants.one; i <= sheet.lastRow.number; i++) {
            const row = sheet.getRow(i);
            for (let j = constants.one; j <= row.cellCount; j++) {
              const cell = row.getCell(j);
              if (cell.value && constants.rowType.test(cell.value.toString())) {
                headerRowIndex = i;
                break;
              }
            }
            if (headerRowIndex !== constants.index) break;
          }

          // Handle error if headerRowIndex is still index constant
          if (headerRowIndex === constants.index) {
            console.log(constants.headerError + sheet.name);
            continue; // Skip to the next sheet
          }

          // Retrieve header row
          const headerRow = sheet.getRow(headerRowIndex);

          // Initialize variables for column indices and nested column
          let rowIdColumnIndex = constants.index;
          let rowStatusColumnIndex = constants.index;
          let nestedColumnStartIndex = constants.index;
          let nestedColumnEndIndex = constants.index;
          let nestedColumn = constants.nestedColumns[sheet.name];

          // Iterate through header row to identify specific columns
          for (
            let sheetColIndex = constants.one;
            sheetColIndex <= sheet.lastColumn.number;
            sheetColIndex++
          ) {
            const cell = headerRow.getCell(sheetColIndex);
            if (cell.value) {
              if (constants.rowIdPattern.test(cell.value.toString())) {
                rowIdColumnIndex = sheetColIndex;
              } else if (constants.rowStatus.test(cell.value.toString())) {
                rowStatusColumnIndex = sheetColIndex;
              } else if (
                nestedColumn &&
                new RegExp(nestedColumn).test(cell.value.toString())
              ) {
                if (nestedColumnStartIndex === constants.index) {
                  nestedColumnStartIndex = sheetColIndex;
                }
                nestedColumnEndIndex = sheetColIndex;
              }
            }
          }

          // Handle error if rowStatusColumnIndex is still index constant
          if (rowStatusColumnIndex === constants.index) {
            console.log(constants.rowStatusError + sheet.name);
            continue; // Skip to the next sheet
          }

          // Initialize arrays and objects to store previous rows and last row at level
          let previousRows = [];
          let lastRowAtLevel = {};

          // Iterate through each row in the sheet
          for (
            let rowIdx = headerRowIndex + constants.one;
            rowIdx <= sheet.lastRow.number;
            rowIdx++
          ) {
            const row = sheet.getRow(rowIdx);

            // Check if the row is empty
            let isRowEmpty = true;
            for (
              let colIdx = constants.one;
              colIdx <= row.cellCount;
              colIdx++
            ) {
              const cell = row.getCell(colIdx);
              if (
                cell.value !== null &&
                cell.value !== undefined &&
                cell.value.toString().trim() !== ''
              ) {
                isRowEmpty = false;
                break;
              }
            }

            // Skip empty rows
            if (isRowEmpty) {
              continue;
            }

            // Retrieve row ID and row status values
            const rowIdCell =
              rowIdColumnIndex !== constants.index
                ? row.getCell(rowIdColumnIndex)
                : null;
            const rowStatusCell = row.getCell(rowStatusColumnIndex);
            const rowValue = rowIdCell ? rowIdCell.value : null;
            const rowStatusValue = rowStatusCell ? rowStatusCell.value : null;

            // Skip rows with no row value when row ID column index is valid
            if (
              rowIdColumnIndex !== constants.index &&
              (rowValue === null || rowValue === undefined)
            ) {
              continue;
            }

            // Determine row level based on row status and nested columns
            let rowLevel = constants.one;
            if (
              rowStatusValue !== null &&
              rowStatusValue !== undefined &&
              rowStatusValue.toString() === constants.sectionHead
            ) {
              rowLevel = constants.zero;
            } else if (
              nestedColumnStartIndex !== constants.index &&
              nestedColumnEndIndex !== constants.index
            ) {
              for (
                let colIdx = nestedColumnStartIndex;
                colIdx <= nestedColumnEndIndex;
                colIdx++
              ) {
                const cell = row.getCell(colIdx);
                if (cell.value) {
                  rowLevel = colIdx - nestedColumnStartIndex + constants.one;
                  break;
                }
              }
            }

            // Initialize parent and sibling row IDs
            let parentRowId = null;
            let siblingRowId = null;

            // Determine parent and sibling row IDs based on previous rows
            for (
              let i = previousRows.length - constants.one;
              i >= constants.zero;
              i--
            ) {
              if (previousRows[i].rowLevel < rowLevel) {
                parentRowId = previousRows[i].id;
                break;
              }
            }

            const lastRowKey = `${parentRowId}-${rowLevel}`;
            if (lastRowAtLevel[lastRowKey]) {
              siblingRowId = lastRowAtLevel[lastRowKey].id;
            }

            let newRowId = null;
            let newRowEntity;

            // Create a new row entity based on row value or generate a new row value
            if (rowValue !== null && rowValue !== undefined) {
              newRowEntity = this.tRowRepository.create({
                row: rowValue.toString(),
                pg: existingPage,
                rowLevel: rowLevel,
                parentRow: parentRowId,
              });
            } else {
              const generatedRowValue = await this.getNextRowValue(
                this.tRowRepository,
              );
              newRowEntity = this.tRowRepository.create({
                row: generatedRowValue.toString(),
                pg: existingPage,
                rowLevel: rowLevel,
                parentRow: parentRowId,
              });
            }

            try {
              // Save the new row entity in t-Row and retrieve the new row ID
              const savedRowEntity =
                await this.tRowRepository.save(newRowEntity);
              newRowId = savedRowEntity.row;

              // Handle case where newRowId is undefined
              if (newRowId === undefined) {
                console.error(constants.emptyRowError);
                continue;
              }

              // Update sibling row ID if siblingRowId is not null
              if (siblingRowId !== null) {
                await this.tRowRepository.update(siblingRowId, {
                  siblingRow: newRowId,
                });
              }

              // Store current row details in previousRows and lastRowAtLevel objects
              previousRows.push({
                id: newRowId,
                rowValue,
                rowLevel,
                parentRowId,
                siblingRowId,
              });

              lastRowAtLevel[lastRowKey] = {
                id: newRowId,
                rowValue,
                rowLevel,
                parentRowId,
              };
            } catch (err) {
              console.error(constants.rowError + err);
              continue; // Skip to the next row in case of error
            }
          }

          // Update sibling rows to null for lastChildRow
          for (let key in lastRowAtLevel) {
            const rowId = lastRowAtLevel[key].id;
            await this.tRowRepository.update(rowId, { siblingRow: null });
          }
        }
      }

      return { message: constants.successMessage };
    } catch (error) {
      // log the error and throw HTTP exception
      console.error(error);
      throw new HttpException(
        constants.serverError,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Function to get the next row value from the repository
  async getNextRowValue(repository: Repository<TRow>): Promise<number> {
    const [lastRow] = await repository.find({
      order: { row: 'DESC' },
      take: 1,
    });
    return lastRow ? parseInt(lastRow.row) + constants.one : constants.one;
  }
}
