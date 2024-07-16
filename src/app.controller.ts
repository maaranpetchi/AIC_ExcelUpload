import {
  Controller,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import * as ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import { Constants } from './Constants';
import { Pool } from 'pg'; 
import { AppService } from './app.service';

@Controller('excel')
export class AppController {
  constructor(private readonly appServices: AppService, @Inject('PG_POOL') private readonly pool: Pool){}

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
        (sheet) => sheet.name === Constants.allCols,
      );
      const allTokensSheet = sheets.find(
        (sheet) => sheet.name === Constants.allTokens,
      );
      if (!allColsSheet) {
        throw new Error(Constants.allColsError);
      }
      let colIdIndex = Constants.index;
      let pageTypeIndex = Constants.index;
      let pageIdIndex = Constants.index;
      let colNameIndex = Constants.index;
      let colDataTypeIndex = Constants.index;
      let colDropDownSourceIndex = Constants.index;
      let headerRowIndex = Constants.index;

      // Find the indices of the headers
      for (let rowIndex = Constants.one; rowIndex <= allColsSheet.lastRow.number; rowIndex++) {
        const row = allColsSheet.getRow(rowIndex);
        for (let colIndex = Constants.one; colIndex <= row.cellCount; colIndex++) {
          const cellValue = row.getCell(colIndex).value?.toString();
          if (cellValue && Constants.colIdPattern.test(cellValue)) {
            colIdIndex = colIndex;
            headerRowIndex = rowIndex;
          }
          if (cellValue && Constants.pageType.test(cellValue)) {
            pageTypeIndex = colIndex;
            headerRowIndex = rowIndex;
          }
          if (cellValue && Constants.pageIdPattern.test(cellValue)) {
            pageIdIndex = colIndex;
            headerRowIndex = rowIndex;
          }
          if (cellValue && Constants.colNamePattern.test(cellValue)) {
            colNameIndex = colIndex;
            headerRowIndex = rowIndex;
          }
          if(cellValue && Constants.colDataType.test(cellValue)){
            colDataTypeIndex = colIndex;
            headerRowIndex = rowIndex;
          }
          if(cellValue && Constants.colDropDownSource.test(cellValue)){
            colDropDownSourceIndex = colIndex;
            headerRowIndex = rowIndex;
          }
        }
        if (headerRowIndex !== Constants.index) break; // Exit the loop once the header is found
      }

      if (
        colIdIndex === Constants.index ||
        pageTypeIndex === Constants.index ||
        pageIdIndex === Constants.index ||
        colNameIndex === Constants.index ||
        colDataTypeIndex === Constants.index ||
        colDropDownSourceIndex === Constants.index
      ) {
        throw new Error(Constants.headerError);
      }

      // Read the data under the headers and store it in the object
      for (let rowIndex = headerRowIndex + Constants.one; rowIndex <= allColsSheet.lastRow.number; rowIndex++) {
        const row = allColsSheet.getRow(rowIndex);
        const colId = row.getCell(colIdIndex).value?.toString();
        const pageType = row.getCell(pageTypeIndex).value?.toString();
        const pageId = row.getCell(pageIdIndex).value?.toString();
        const colName = row.getCell(colNameIndex).value?.toString();
        const colDataType = row.getCell(colDataTypeIndex).value?.toString();
        const colDropDownSource = row.getCell(colDropDownSourceIndex).value?.toString();
        if (colId && colName) {
          colData[colId] = {
            pageType,
            pageId,
            colName,
            colDataType,
            colDropDownSource,
          };
        }
      }

      console.log('Col Data:', colData);

      // Process Col ID header and save 'tCol' table data
      for (let rowIndex = headerRowIndex + Constants.one; rowIndex <= allColsSheet.lastRow.number; rowIndex++) {
        const row = allColsSheet.getRow(rowIndex);
        const colId = row.getCell(colIdIndex).value?.toString();
        if(colId !== null && colId !== undefined){
          await Constants.insertCol(this.pool, Number(colId));
        }
        
      }

      // Function to store the key value pair of datatype and row ID in all tokens

      const dataTypeToRowId = {};
      const dataType = [];
      const RowId = [];
      let rowColIndex = Constants.index;
      let rowTypeAllTokensColIndex = Constants.index;

      // Dynamically find the header row
      headerRowIndex = Constants.index;
      for (let i = Constants.one; i <= allTokensSheet.lastRow.number; i++) {
        const row = allTokensSheet.getRow(i);
        for (let j = Constants.one; j <= row.cellCount; j++) {
          const cell = row.getCell(j);
          if (
            cell.value &&
            Constants.tokenPattern.test(cell.value.toString())
          ) {
            headerRowIndex = i;
            break;
          }
        }
        if (headerRowIndex !== Constants.index) break;
      }
      if (headerRowIndex === Constants.index) {
        console.log(`Header row not found in sheet ${allTokensSheet.name}`);
      } else {
        console.log(`Header row found at index: ${headerRowIndex}`);
      }

      // Find the start and end columns for the merged "Token" header
      let tokenColStartIndex = Constants.index;
      let tokenColEndIndex = Constants.index;
      if (headerRowIndex !== Constants.index) {
        const headerRow = allTokensSheet.getRow(headerRowIndex);
        for (
          let sheetColIndex = Constants.one;
          sheetColIndex <= allTokensSheet.lastColumn.number;
          sheetColIndex++
        ) {
          const cell = headerRow.getCell(sheetColIndex);
          if (
            cell.value &&
            Constants.tokenPattern.test(cell.value.toString())
          ) {
            if (tokenColStartIndex === Constants.index) {
              tokenColStartIndex = sheetColIndex;
            }
            tokenColEndIndex = sheetColIndex;
          }
          if (cell.value && Constants.rowId.test(cell.value.toString())) {
            rowColIndex = sheetColIndex;
          }
          if(cell.value && Constants.rowType.test(cell.value.toString())){
            rowTypeAllTokensColIndex = sheetColIndex;
          }
        }
        if (
          tokenColStartIndex === Constants.index ||
          tokenColEndIndex === Constants.index ||
          rowColIndex === Constants.index
        ) {
          console.log(
            `Token column start or end and row not found in sheet ${allTokensSheet.name}`,
          );
        } else {
          console.log(
            `Token column start index: ${tokenColStartIndex}, end index: ${tokenColEndIndex}, row column index: ${rowColIndex}`,
          );
        }
      }

      // Identify the "DataType" row dynamically within the "Token" header columns
      let dataTypeRowIndex = Constants.index;
      let dataTypeColIndex = Constants.index;
      if (tokenColStartIndex !== Constants.index && tokenColEndIndex !== Constants.index) {
        for (
          let i = headerRowIndex + Constants.one;
          i <= allTokensSheet.lastRow.number;
          i++
        ) {
          const row = allTokensSheet.getRow(i);
          for (let j = tokenColStartIndex; j <= tokenColEndIndex; j++) {
            const cell = row.getCell(j);
            if (cell.value && Constants.dataType.test(cell.value.toString())) {
              dataTypeRowIndex = i;
              dataTypeColIndex = j;
              break;
            }
          }
          if (dataTypeRowIndex !== Constants.index && dataTypeColIndex !== Constants.index) break;
        }
        if (dataTypeRowIndex === Constants.index) {
          console.log(`DataType row not found in sheet ${allTokensSheet.name}`);
        } else {
          console.log(
            `DataType found at row index: ${dataTypeRowIndex}, col index: ${dataTypeColIndex}`,
          );
        }
      }
      let shouldBreak = false;
      // Collect values under the "Token" header after the "DataType" row
      if (
        dataTypeRowIndex !== Constants.index &&
        tokenColStartIndex !== Constants.index &&
        tokenColEndIndex !== Constants.index &&
        rowColIndex !== Constants.index
      ) {
        for (
          let i = dataTypeRowIndex + Constants.one;
          i <= allTokensSheet.lastRow.number;
          i++
        ) {
          const row = allTokensSheet.getRow(i);
          for (let j = dataTypeColIndex; j <= tokenColEndIndex; j++) {
            const cell = row.getCell(j);
            let tokenValue;
            if (cell.value != null || cell.value != undefined) {
              tokenValue = cell.value.toString();
            }

            // Check if there's a corresponding RowId value in the same row
            const rowCell = row.getCell(rowColIndex);
            const rowValue = rowCell ? rowCell.value : null;

            // Break if a value is found in the same column index as "DataType"
            if (
              j === dataTypeColIndex &&
              cell.value != null &&
              cell.value != undefined
            ) {
              shouldBreak = true;
              break;
            }
            if (shouldBreak) break;

            // Store the hierarchy and row value
            if (
              rowValue !== null &&
              rowValue !== undefined &&
              tokenValue !== null &&
              tokenValue !== undefined
            ) {
              dataType.push(tokenValue);
              RowId.push(rowValue.toString());
            }
          }
        }
      }

      // Create key-value pairs with RowType as key and RowId as value
      for (let i = Constants.zero; i < dataType.length; i++) {
        dataTypeToRowId[dataType[i]] = RowId[i];
      }
      console.log('Data-Type:', dataTypeToRowId);

      for (const sheet of sheets) {
        if (Constants.sheetNames.includes(sheet.name)) {
          console.log(`Processing sheet: ${sheet.name}`);

          // Process 'All Pages' sheet
          if (sheet.name === Constants.allPages) {
            // Initialize arrays to store page IDs and names
            const pageIds: string[] = [];
            const pageNames: string[] = [];

            // Iterate through each cell in the sheet
            for (
              let sheetRowIndex = Constants.one;
              sheetRowIndex <= sheet.lastRow.number;
              sheetRowIndex++
            ) {
              for (
                let sheetColIndex = Constants.one;
                sheetColIndex <= sheet.lastColumn.number;
                sheetColIndex++
              ) {
                const cell = sheet.getCell(sheetRowIndex, sheetColIndex);

                // Check for page ID pattern and populate pageIds array
                if (
                  cell.value &&
                  Constants.pageIdMandatory.test(cell.value.toString())
                ) {
                  for (
                    let rowIdx = Constants.one;
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
                  Constants.pageName.test(cell.value.toString())
                ) {
                  for (
                    let rowIdx = Constants.one;
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


            // Iterate through all the Page ID's and insert into tPg table through insertPg 
            for (const Pg of pageIds.slice(Constants.one)) {
              const tpgEntity = Constants.insertPg(this.pool,Number(Pg));
            }

            // Create a key-value pair of page ID and page name
            for (let i = Constants.zero; i < pageIds.length; i++) {
              pageIdToNameMap[pageNames[i]] = pageIds[i];
            }
          }

          // Check if sheet name is a key in pageIdToNameMap
          if (sheet.name in pageIdToNameMap) {
            var pageId = pageIdToNameMap[sheet.name];
          }

          // Find header row index based on specific Constants
          let headerRowIndex = Constants.index;
          for (let i = Constants.one; i <= sheet.lastRow.number; i++) {
            const row = sheet.getRow(i);
            for (let j = Constants.one; j <= row.cellCount; j++) {
              const cell = row.getCell(j);
              if (cell.value && Constants.rowType.test(cell.value.toString())) {
                headerRowIndex = i;
                break;
              }
            }
            if (headerRowIndex !== Constants.index) break;
          }

          // Handle error if headerRowIndex is still index constant
          if (headerRowIndex === Constants.index) {
            console.log(Constants.headerError + sheet.name);
            continue; // Skip to the next sheet
          }

          // Retrieve header row
          const headerRow = sheet.getRow(headerRowIndex);

          // Initialize variables for column indices and nested column
          let rowIdColumnIndex = Constants.index;
          let rowStatusColumnIndex = Constants.index;
          let nestedColumnStartIndex = Constants.index;
          let nestedColumnEndIndex = Constants.index;
          let nestedColumn = Constants.nestedColumns[sheet.name];

          // Iterate through header row to identify specific columns
          for (
            let sheetColIndex = Constants.one;
            sheetColIndex <= sheet.lastColumn.number;
            sheetColIndex++
          ) {
            const cell = headerRow.getCell(sheetColIndex);
            if (cell.value) {
              if (Constants.rowId.test(cell.value.toString())) {
                rowIdColumnIndex = sheetColIndex;
              } else if (Constants.rowStatus.test(cell.value.toString())) {
                rowStatusColumnIndex = sheetColIndex;
              } else if (
                nestedColumn &&
                new RegExp(nestedColumn).test(cell.value.toString())
              ) {
                if (nestedColumnStartIndex === Constants.index) {
                  nestedColumnStartIndex = sheetColIndex;
                }
                nestedColumnEndIndex = sheetColIndex;
              }

            }
          }

          // Handle error if rowStatusColumnIndex is still index constant
          if (rowStatusColumnIndex === Constants.index) {
            console.log(Constants.rowStatusError + sheet.name);
            continue; // Skip to the next sheet
          }

          // Initialize arrays and objects to store previous rows and last row at level
          let previousRows = [];
          let lastRowAtLevel = {};

          // Iterate through each row in the sheet
          for (
            let rowIdx = headerRowIndex + Constants.one;
            rowIdx <= sheet.lastRow.number;
            rowIdx++
          ) {
            const row = sheet.getRow(rowIdx);

            // Check if the row is empty
            let isRowEmpty = true;
            for (
              let colIdx = Constants.one;
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
              rowIdColumnIndex !== Constants.index
                ? row.getCell(rowIdColumnIndex)
                : null;
            const rowStatusCell = row.getCell(rowStatusColumnIndex);
            const rowValue = rowIdCell ? rowIdCell.value : null;
            const rowStatusValue = rowStatusCell ? rowStatusCell.value : null;

            // Skip rows with no row value when row ID column index is valid
            if (
              rowIdColumnIndex !== Constants.index &&
              (rowValue === null || rowValue === undefined)
            ) {
              continue;
            }

            // Determine row level based on row status and nested columns
            let rowLevel = Constants.one;
            if (
              rowStatusValue !== null &&
              rowStatusValue !== undefined &&
              rowStatusValue.toString() === Constants.sectionHead
            ) {
              rowLevel = Constants.zero;
            } else if (
              nestedColumnStartIndex !== Constants.index &&
              nestedColumnEndIndex !== Constants.index
            ) {
              for (
                let colIdx = nestedColumnStartIndex;
                colIdx <= nestedColumnEndIndex;
                colIdx++
              ) {
                const cell = row.getCell(colIdx);
                if (cell.value) {
                  rowLevel = colIdx - nestedColumnStartIndex + Constants.one;
                  break;
                }
              }
            }

            // Initialize parent and sibling row IDs
            let parentRowId = null;
            let siblingRowId = null;

            // Determine parent and sibling row IDs based on previous rows
            for (
              let i = previousRows.length - Constants.one;
              i >= Constants.zero;
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
            let savedRowEntity

            // Create a new row entity based on row value or generate a new row value
            if (rowValue !== null && rowValue !== undefined) {
              savedRowEntity = await Constants.insertRow(this.pool, Number(rowValue), Number(pageId), rowLevel, parentRowId);
            } else {
              const nextRowValue = await Constants.getNextRowValue(this.pool);
              savedRowEntity = await Constants.insertRow(this.pool, Number(nextRowValue), Number(pageId), rowLevel, parentRowId);

            }

            try {
              // Save the new row entity in tRow and retrieve the new row ID
              newRowId = savedRowEntity;

              // Handle case where newRowId is undefined
              if (newRowId === undefined) {
                console.error(Constants.emptyRowError);
                continue;
              }

              await Constants.updateSiblingRow(this.pool, siblingRowId, newRowId);

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
              console.error(Constants.rowError + err);
              continue; // Skip to the next row in case of error
            }

            // Check every cell in inserted row that is present in tItemColumns or tFormatColumns to insert into tCell, tItem and tFormat

            for (let colIdx = Constants.one;colIdx <= row.cellCount;colIdx++) {
              let isTitemColumn = false;
              let isTformatColumn = false;
              let colID;
              let colDataType;
              let colDropDownSource;
              let savedCellEntity;

              const cellValue = sheet.getCell(rowIdx, colIdx).value?.toString();

              if(cellValue != null && cellValue != undefined){
                // Get the header cell value for the current column index
                const headerCell = sheet.getRow(headerRowIndex).getCell(colIdx);
                let headerCellValue = headerCell.value?.toString().trim();
                // Remove trailing '*' if present
                if (headerCellValue?.endsWith(Constants.star)) {
                  headerCellValue = headerCellValue.slice(Constants.zero, Constants.index); // Remove the last character
                }

                if(headerCellValue != null || headerCellValue != undefined)
                {
                  for (const key in Constants.titemColumns) {
                    if (Constants.titemColumns[key].test(headerCellValue)) {
                      isTitemColumn = true;
                      break;
                    }
                  }
                  for(const key in Constants.tformatColumns){
                    if(Constants.tformatColumns[key].test(headerCellValue)){
                      isTformatColumn = true;
                      break;
                    }
                  }
                  if(isTitemColumn){
                    for(const key in colData){
                      if (colData[key].colName === headerCellValue && (colData[key].pageId == pageId || colData[key].pageType == Constants.eachPage)) {
                        colID = key;
                        colDataType = colData[key].colDataType;
                        colDropDownSource = colData[key].colDropDownSource;
                        break;
                      }
                    }
                    if(colID != null && savedRowEntity != null){
                      savedCellEntity = await Constants.insertCell(this.pool, colID, savedRowEntity);

                      // if (savedCellEntity != null && savedCellEntity != undefined) {
                      //   if (Constants.titemColumns.pageType.test(headerCellValue)) {
                      //     const dataType = dataTypeToRowId[colDataType];
                          
                      //     if (colDropDownSource && dataType) {
                      //       // Step 1: Find the row in allTokensSheet where RowType is "node" and the Token value is colDropDownSource
                      //       let tokenRowIndex = Constants.index;
                      //       for (let rowIndex = Constants.one; rowIndex <= allTokensSheet.lastRow.number; rowIndex++) {
                      //         const row = allTokensSheet.getRow(rowIndex);
                      //         const rowTypeCell = row.getCell(rowTypeAllTokensColIndex);
                      //         const tokenCell = row.getCell(tokenColStartIndex);
                      
                      //         if (rowTypeCell && tokenCell && Constants.node.test(rowTypeCell.value?.toString()) && tokenCell.value?.toString() === colDropDownSource) {
                      //           tokenRowIndex = rowIndex;
                      //           break;
                      //         }
                      //       }
                      

                      //       if (tokenRowIndex !== Constants.index) {
                      //         // Step 2: Retrieve the values under the found token
                      //         const tokenValues = [];
                      //         for (
                      //           let rowIdx = tokenRowIndex + Constants.one;
                      //           rowIdx <= allTokensSheet.lastRow.number;
                      //           rowIdx++
                      //         ) {
                      //           for (let colIndex = tokenColStartIndex; colIndex <= tokenColEndIndex; colIndex++) {
                      //             const cell = allTokensSheet.getRow(rowIdx).getCell(colIndex);
                      //             if (cell && cell.value) {
                      //               tokenValues.push(cell.value.toString());
                      //             }
                      //           }
                      //         }
                              
                      
                      //         // Step 3: Check if cellValue matches any of these token values
                      //         const matchedRowIndex = tokenValues.findIndex(value => value === cellValue);
                      
                      //         if (matchedRowIndex !== -1) {
                      //           // Step 4: Fetch the Row ID
                      //           const rowIDCell = allTokensSheet.getRow(matchedRowIndex).getCell(rowColIndex);
                      //           if (rowIDCell && rowIDCell.value) {
                      //             const rowIDValue = rowIDCell.value.toString();
                                  
                      //             // Use the rowIDValue for your logic
                      //             console.log('Matched Row ID Value:', rowIDValue);
                      //             // You can now proceed with your logic using rowIDValue
                      //           }
                      //         }
                      //       }
                      //     }
                      //   }
                      // }
                      
                      
                    }
                  }
                  if(isTformatColumn){

          
                  }
                }
              }
            }
          }

          // Update sibling rows to null for lastChildRow
          for (let key in lastRowAtLevel) {
            const rowId = lastRowAtLevel[key].id;
            await Constants.updateSiblingRowToNull(this.pool, rowId);
          }
        }
      }

      return { message: Constants.successMessage };
    } catch (error) {
      // log the error and throw HTTP exception
      console.error(error);
      throw new HttpException(
        Constants.serverError,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
