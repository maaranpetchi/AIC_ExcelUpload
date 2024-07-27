import { HttpException, HttpStatus, Inject, Injectable, UploadedFile } from '@nestjs/common';
import { Pool } from 'pg';
import { constants } from './include';
import * as ExcelJS from 'exceljs';

@Injectable()
export class AppService {

  constructor(@Inject('PG_POOL') private readonly pool: Pool) { }
  
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      await this.pool.query(constants.disableForeignKeyQuery);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const sheets = workbook.worksheets;
      const pageIdToNameMap: { [pageName: string]: string } = {};
      const dropdownSourceKeyValuePairs: { [key: string]: any } = {};
      //--Col Id to Col name mapping
      const colData = {}; // Object to store Col ID, Page Type, Page ID, and Col Name

      //Process All Languages sheet to find the Row Id of English language
      const allLanguagesSheet = sheets.find(
        (sheet) => sheet.name === constants.allLanguages,
      );
      // Dynamically find the header row
      let languageheaderRowIndex = constants.index;
      let languageheaderColIndex = constants.index;
      let englishRowId;
      for (let i = constants.one; i <= allLanguagesSheet.lastRow.number; i++) {
        const row = allLanguagesSheet.getRow(i);
        for (let j = constants.one; j <= row.cellCount; j++) {
          const cell = row.getCell(j);
          if (cell.value && constants.language.test(cell.value.toString())) {
            languageheaderRowIndex = i;
            languageheaderColIndex = j;
            break;
          }
        }
        if (
          languageheaderRowIndex !== constants.index &&
          languageheaderColIndex !== constants.index
        )
          break;
      }
      if (
        languageheaderRowIndex !== constants.index &&
        languageheaderColIndex !== constants.index
      ) {
        for (
          let rowIndx = languageheaderRowIndex + constants.one;
          rowIndx <= allLanguagesSheet.lastRow.number;
          rowIndx++
        ) {
          const rowCell = allLanguagesSheet
            .getCell(rowIndx, languageheaderColIndex)
            .value.toString();
          if (rowCell == constants.english) {
            englishRowId = allLanguagesSheet
              .getCell(rowIndx, languageheaderColIndex - constants.one)
              .value.toString();
          }
        }
      }
      // Process the 'All Cols' sheet first
      const allColsSheet = sheets.find(
        (sheet) => sheet.name === constants.allCols,
      );
      // Find 'All Tokens' sheet
      const allTokensSheet = sheets.find(
        (sheet) => sheet.name === constants.allTokens,
      );
      // Find 'All Labels' sheet
      const allLabelsSheet = sheets.find(
        (sheet) => sheet.name === constants.allLabels,
      );
     // Find 'All Units' sheet
     const allUnitsSheet = sheets.find(
      (sheet) => sheet.name === constants.allUnits,
    );
      if (!allColsSheet) {
        throw new Error(constants.allColsError);
      }
      let colIdIndex = constants.index;
      let pageTypeIndex = constants.index;
      let pageIdIndex = constants.index;
      let colNameIndex = constants.index;
      let colDataTypeIndex = constants.index;
      let colDropDownSourceIndex = constants.index;
      let colStatusIndex = constants.index;
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
          if (cellValue && constants.pageType.test(cellValue)) {
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
          if (cellValue && constants.colDataType.test(cellValue)) {
            colDataTypeIndex = colIndex;
            headerRowIndex = rowIndex;
          }
          if (cellValue && constants.colDropDownSource.test(cellValue)) {
            colDropDownSourceIndex = colIndex;
            headerRowIndex = rowIndex;
          }
          if(cellValue && constants.colStatus === cellValue){
            colStatusIndex = colIndex;
            headerRowIndex = rowIndex;
          }
        }
        if (headerRowIndex !== constants.index) break; // Exit the loop once the header is found
      }

      if (
        colIdIndex === constants.index ||
        pageTypeIndex === constants.index ||
        pageIdIndex === constants.index ||
        colNameIndex === constants.index ||
        colDataTypeIndex === constants.index ||
        colDropDownSourceIndex === constants.index ||
        colStatusIndex === constants.index
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
        const colDataType = row.getCell(colDataTypeIndex).value?.toString();
        const colDropDownSource = row
          .getCell(colDropDownSourceIndex)
          .value?.toString();
        const colStatus = row.getCell(colStatusIndex).value?.toString();
        if (colId && colName) {
          colData[colId] = {
            pageType,
            pageId,
            colName,
            colDataType,
            colDropDownSource,
            colStatus,
          };
        }
      }
     
      // Process Col ID header and save 'tCol' table data
      for (
        let rowIndex = headerRowIndex + constants.one;
        rowIndex <= allColsSheet.lastRow.number;
        rowIndex++
      ) {
        const row = allColsSheet.getRow(rowIndex);
        const colId = row.getCell(colIdIndex).value?.toString();
        if (colId !== null && colId !== undefined) {
          const insertTColQuery = {
            text: constants.inserttColQuery,
            values: [colId]
          };
          await this.pool.query(insertTColQuery);
        }
      }

      // Function to store the key value pair of datatype and row ID in all tokens

      const dataTypeToRowId = {};
      const objectTypeToRowId = {};
      const statusesToRowId = {};

      let rowAllTokensColIndex = constants.index;
      let rowTypeAllTokensColIndex = constants.index;

      // Dynamically find the header row
      headerRowIndex = constants.index;
      for (let i = constants.one; i <= allTokensSheet.lastRow.number; i++) {
        const row = allTokensSheet.getRow(i);
        for (let j = constants.one; j <= row.cellCount; j++) {
          const cell = row.getCell(j);
          if (
            cell.value &&
            constants.tokenPattern.test(cell.value.toString())
          ) {
            headerRowIndex = i;
            break;
          }
        }
        if (headerRowIndex !== constants.index) break;
      }
      if (headerRowIndex === constants.index) {
        console.log(constants.headerError + allTokensSheet.name);
      }

      // Find the start and end columns for the merged "Token" header
      let tokenColStartIndex = constants.index;
      let tokenColEndIndex = constants.index;
      let urlTypeRowID = null;
      let ddsTypeRowID = null;
      if (headerRowIndex !== constants.index) {
        const headerRow = allTokensSheet.getRow(headerRowIndex);
        for (
          let sheetColIndex = constants.one;
          sheetColIndex <= allTokensSheet.lastColumn.number;
          sheetColIndex++
        ) {
          const cell = headerRow.getCell(sheetColIndex);
          if (
            cell.value &&
            constants.tokenPattern.test(cell.value.toString())
          ) {
            if (tokenColStartIndex === constants.index) {
              tokenColStartIndex = sheetColIndex;
            }
            tokenColEndIndex = sheetColIndex;
          }
          if (cell.value && constants.rowId.test(cell.value.toString())) {
            rowAllTokensColIndex = sheetColIndex;
          }
          if (cell.value && constants.rowType.test(cell.value.toString())) {
            rowTypeAllTokensColIndex = sheetColIndex;
          }
        }
        if (
          tokenColStartIndex === constants.index ||
          tokenColEndIndex === constants.index ||
          rowAllTokensColIndex === constants.index
        ) {
          console.log(constants.allTokenIndexError + allTokensSheet.name);
        }
      }
      //Dynamically find the header row of all labels sheet.
      let allLabelsHeaderRowIndex;
      for (
        let rowIndex = constants.one;
        rowIndex <= allLabelsSheet.lastRow.number;
        rowIndex++
      ) {
        const row = allLabelsSheet.getRow(rowIndex);
        for (
          let colIndex = constants.one;
          colIndex <= row.cellCount;
          colIndex++
        ) {
          const cellValue = row.getCell(colIndex).value?.toString();
          if (cellValue && constants.label.test(cellValue)) {
            allLabelsHeaderRowIndex = rowIndex;
            break;
          }
        }
      }
      // Find the start and end columns for the merged "Label" header in all labels sheet
      let labelColStartIndex = constants.index;
      let labelColEndIndex = constants.index;
      let rowAllLabelsColIndex = constants.index;
      let valueDefaultDataColIndex = constants.index;
      if (headerRowIndex !== constants.index) {
        const headerRow = allLabelsSheet.getRow(allLabelsHeaderRowIndex);
        for (
          let sheetColIndex = constants.one;
          sheetColIndex <= allLabelsSheet.lastColumn.number;
          sheetColIndex++
        ) {
          const cell = headerRow.getCell(sheetColIndex);
          if (
            cell.value &&
            constants.label.test(cell.value.toString())
          ) {
            if (labelColStartIndex === constants.index) {
              labelColStartIndex = sheetColIndex;
            }
            labelColEndIndex = sheetColIndex;
          }
          if (cell.value && constants.rowId.test(cell.value.toString())) {
            rowAllLabelsColIndex = sheetColIndex;
          }
          if(cell.value && constants.titemColumns.valueDefaultData === cell.value.toString()){
            valueDefaultDataColIndex = sheetColIndex;
          }
        }
        if (
          labelColStartIndex === constants.index ||
          labelColEndIndex === constants.index ||
          rowAllLabelsColIndex === constants.index ||
          valueDefaultDataColIndex === constants.index
        ) {
          console.log(constants.allLabelsIndexError + allLabelsSheet.name);
        }
      }
      //Find and Store the URL & ddsType Row ID 
      for (
        let i = headerRowIndex + constants.one;
        i <= allTokensSheet.lastRow.number;
        i++
      ) {
        const row = allTokensSheet.getRow(i);
        for (let j = tokenColStartIndex; j <= tokenColEndIndex; j++) {
          const cell = row.getCell(j);
          if (cell.value && (cell.value.toString()) === constants.urltype) {
            urlTypeRowID = row.getCell(rowAllTokensColIndex);
          }
          if (cell.value && (cell.value.toString()) === constants.ddstype) {
            ddsTypeRowID = row.getCell(rowAllTokensColIndex).value.toString();
          }
          if (urlTypeRowID !== null && ddsTypeRowID !== null) {
            break;
          }
        }
      }
      // Identify the "DataType", "UserType" and "Object" row dynamically within the "Token" header columns
      let dataTypeRowIndex = constants.index;
      let dataTypeColIndex = constants.index;
      let userTypeRowIndex = constants.index;
      let objectTypeRowIndex = constants.index;
      let objectTypeColIndex = constants.index;
      let statuesRowIndex = constants.index;
      let statuesColIndex = constants.index;
      if (
        tokenColStartIndex !== constants.index &&
        tokenColEndIndex !== constants.index
      ) {
        for (
          let i = headerRowIndex + constants.one;
          i <= allTokensSheet.lastRow.number;
          i++
        ) {
          const row = allTokensSheet.getRow(i);
          for (let j = tokenColStartIndex; j <= tokenColEndIndex; j++) {
            const cell = row.getCell(j);
            if(cell.value && constants.userType === cell.value.toString()){
              userTypeRowIndex = i;
            }
            if(cell.value && constants.objectType === cell.value.toString()){
              objectTypeRowIndex = i;
              objectTypeColIndex = j;
            }
            if (cell.value && constants.dataType.test(cell.value.toString())) {
              dataTypeRowIndex = i;
              dataTypeColIndex = j;
            }
            if (cell.value && constants.statuses === cell.value.toString()) {
              statuesRowIndex = i;
              statuesColIndex = j;
            }
          }
          if (
            dataTypeRowIndex !== constants.index &&
            dataTypeColIndex !== constants.index &&
            userTypeRowIndex !== constants.index &&
            objectTypeRowIndex !== constants.index &&
            objectTypeColIndex !== constants.index &&
            statuesRowIndex !== constants.index &&
            statuesColIndex !== constants.index 
          )
            break;
        }
        if (dataTypeRowIndex === constants.index || 
          userTypeRowIndex === constants.index || 
          objectTypeRowIndex === constants.index || 
          objectTypeColIndex === constants.index || 
          statuesRowIndex === constants.index ||
          statuesColIndex === constants.index ) {
          console.log(constants.datatypeError + allTokensSheet.name);
        }
      }
      let shouldBreak = false;
      // Collect values under the "Token" header after the "DataType" row
      if (
        dataTypeRowIndex !== constants.index &&
        tokenColStartIndex !== constants.index &&
        tokenColEndIndex !== constants.index &&
        rowAllTokensColIndex !== constants.index
      ) {
        const dataTypeResult = await this.findValuesAndRowIdInAllTokens(
          allTokensSheet,
          dataTypeRowIndex,
          dataTypeColIndex,
          tokenColEndIndex,
          rowAllTokensColIndex
        );
        // Create key-value pairs with RowType as key and RowId as value
        for (let i = constants.zero; i < dataTypeResult.value.length; i++) {
          dataTypeToRowId[dataTypeResult.value[i]] = dataTypeResult.rowIdOfValue[i];
        }
      }
          // Find the values under Object to store as key value pair for tFormat.ObjectType
          if (
            objectTypeRowIndex !== constants.index &&
            objectTypeColIndex !== constants.index &&
            tokenColStartIndex !== constants.index &&
            tokenColEndIndex !== constants.index &&
            rowAllTokensColIndex !== constants.index
          ) {
            const objectTypeResult = await this.findValuesAndRowIdInAllTokens(
              allTokensSheet,
              objectTypeRowIndex,
              objectTypeColIndex,
              tokenColEndIndex,
              rowAllTokensColIndex
            );
            // Create key-value pairs with Object as key and RowId as value
            for (let i = 0; i < objectTypeResult.value.length; i++) {
              objectTypeToRowId[objectTypeResult.value[i]] = objectTypeResult.rowIdOfValue[i];
            }
      }

       // Find the values under Statuses to store as key value pair for tFormat.ObjectType
      if (
        statuesRowIndex !== constants.index &&
        statuesColIndex !== constants.index &&
        tokenColStartIndex !== constants.index &&
        tokenColEndIndex !== constants.index &&
        rowAllTokensColIndex !== constants.index
      ) {
        const statusesResult = await this.findValuesAndRowIdInAllTokens(
          allTokensSheet,
          statuesRowIndex,
          statuesColIndex,
          tokenColEndIndex,
          rowAllTokensColIndex
        );
        for (let i = 0; i < statusesResult.value.length; i++) {
          statusesToRowId[statusesResult.value[i]] = statusesResult.rowIdOfValue[i];
        }
    }
      //Find the Admin and default expand level in all labels sheet with the default data
      let adminRowIndex = constants.index;
      let defaultExpandLevelRowIndex = constants.index;
      let foundAdmin = false;
      let foundDefaultExpand = false;

      for (let j = labelColStartIndex; j <= labelColEndIndex; j++) {
        for (let i = allLabelsHeaderRowIndex + constants.one; i <= allLabelsSheet.lastRow.number; i++) {
          const row = allLabelsSheet.getRow(i);
          const cell = row.getCell(j);

          if (cell.value != null && cell.value != undefined) {
            if (cell.value.toString() === constants.admin && !foundAdmin) {
              adminRowIndex = i;
              foundAdmin = true;
            } else if (cell.value.toString() === constants.defaultExpandLevel && !foundDefaultExpand) {
              defaultExpandLevelRowIndex = i;
              foundDefaultExpand = true;
            }
          }

          if (foundAdmin && foundDefaultExpand) break; // Break the inner loop
        }

        if (foundAdmin && foundDefaultExpand) break; // Break the outer loop
      }


      // Find the default data by fetching the cell in Admin Row and value Default data column 
      const userId = allLabelsSheet.getCell(adminRowIndex, valueDefaultDataColIndex).value.toString();
      const defaultPgExpandLevel = allLabelsSheet.getCell(defaultExpandLevelRowIndex, valueDefaultDataColIndex).value.toString();

      let userTypeRowId = null;

      // Check all tokens sheet for the Default User type
      for (let i = userTypeRowIndex; i <= allTokensSheet.lastRow.number; i++) {
        for (let j = tokenColStartIndex; j <= tokenColEndIndex; j++) {
          const row = allTokensSheet.getRow(i);
          const cell = row.getCell(j);
          if(cell.value != null && cell.value != undefined){
            if (cell.value.toString() === constants.adminUserType) {
              userTypeRowId = row.getCell(rowAllTokensColIndex).value.toString();
              break;
            }
          }
        }
        if (userTypeRowId !== null) break;
      }
      //Insert the Amin User into tUser table
      if(userTypeRowId !== null && userTypeRowId != undefined && userId !== null && userId != undefined){
        const inserttUserQuery = {
          text: constants.inserttUserQuery,
          values: [userId, userTypeRowId]
        };
        const adminUser = await this.pool.query(inserttUserQuery);
      }
      else{
        console.log(constants.userNotFoundError);
      }
      

      // Insert the tRow.Row with zero for default data cell creation.
      const insertDefaultTRowQuery = {
        text: constants.insertDefaulttRowQuery,
        values: [constants.zero, constants.one]
      };
      await this.pool.query(insertDefaultTRowQuery);

      for (const sheet of sheets) {
        if (constants.sheetNames.includes(sheet.name)) {
          console.log(constants.process + sheet.name);

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
                  constants.pageIdMandatory.test(cell.value.toString())
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
                  constants.pageName.test(cell.value.toString())
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
            let pagetFormatId;
            // Iterate through all the Page ID's and insert into tPg table through insertPg
            for (const Pg of pageIds.slice(constants.one)) {
              const inserttPgQuery = {
                text: constants.inserttPgQuery,
                values: [Pg]
              };
              try{
                await this.pool.query(inserttPgQuery);
              }
              catch(error){
                console.error(constants.tPgError, error);
              }
            // Method to Find the Nested Column ID in a page.
            let nestedColId;
            for (const colId in colData) {
              const col = colData[colId];
              if (col.pageId === Pg && col.colStatus.includes(constants.nested)) {
                nestedColId = colId;
                break;
              }
            }
            // Insert a tFormat record for each Page in all pages sheet.
            const pgObjectType = objectTypeToRowId[constants.page]
            const inserttFormatForPageQuery = {
              text: constants.inserttFormatForPageQuery,
              values: [userId, pgObjectType, Pg, userId, defaultPgExpandLevel, nestedColId]
            };
            try{
              const pagetFormatRecord = await this.pool.query(inserttFormatForPageQuery);
              pagetFormatId = pagetFormatRecord.rows[0].Format;  
            }
            catch(error){
              console.error(constants.tFormatForPageError, error);
            }
            }
            // Create a key-value pair of page ID and page name
            for (let i = constants.zero; i < pageIds.length; i++) {
              pageIdToNameMap[pageNames[i]] = pageIds[i];
            }
          }

          // Check if sheet name is a key in pageIdToNameMap
          if (sheet.name in pageIdToNameMap) {
            var pageId = pageIdToNameMap[sheet.name];
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
              if (constants.rowId.test(cell.value.toString())) {
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
            let rowValue = rowIdCell ? rowIdCell.value : null;
            const rowStatusValue = rowStatusCell ? rowStatusCell.value : null;
            // Special case for "All Pages" sheet to stop inserting Rows if a Row without Row Id is found
            if (sheet.name === constants.allPages && rowIdColumnIndex !== constants.index && (rowValue === null || rowValue === undefined)) {
              continue;
            } else if (
              rowIdColumnIndex !== constants.index &&
              (rowValue === null || rowValue === undefined)
            ) {
              const nextRowValue = await this.getNextRowValue();
              rowValue = nextRowValue;
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
            let savedRowEntity;

            // Create a new row entity based on row value or generate a new row value
            if (rowValue !== null && rowValue !== undefined) {
              const inserttRowQuery = {
                text: constants.inserttRowQuery,
                values: [Number(rowValue), Number(pageId), rowLevel, parentRowId]
              };
              try {
                // Execute the insert query and save the new row ID in savedRowEntity. 
                const result = await this.pool.query(inserttRowQuery);
                savedRowEntity = result.rows[0].Row;
              } catch (error) {
                console.error(constants.rowError, error);
                throw error;
              }
            } else {
              const nextRowValue = await this.getNextRowValue();
              const inserttRowQuery = {
                text: constants.inserttRowQuery,
                values: [Number(nextRowValue), Number(pageId), rowLevel, parentRowId]
              };
              try {
                // Execute the insert query and save the new row ID in savedRowEntity. 
                const result = await this.pool.query(inserttRowQuery);
                savedRowEntity = result.rows[0].Row;
              } catch (error) {
                console.error(constants.rowError, error);
                throw error;
              }
            }
            try {
              // Save the new row entity in tRow and retrieve the new row ID
              newRowId = savedRowEntity;
              // Store the Row value with the Token as a key value pair to validate with the DropDown Source column
              if (rowLevel === constants.zero) {
                dropdownSourceKeyValuePairs[row.getCell(nestedColumnStartIndex).value.toString()] = savedRowEntity;
                // console.log(dropdownSourceKeyValuePairs);
              }
              // Handle case where newRowId is undefined
              if (newRowId === undefined) {
                console.error(constants.emptyRowError);
                continue;
              }
              const updateSiblingRowIntRowQuery = {
                text: constants.updateSiblingRowIntRowQuery,
                values: [newRowId, siblingRowId],
              };
              try {
                await this.pool.query(updateSiblingRowIntRowQuery);
              } catch (error) {
                console.error(constants.siblingRowUpdateError, error);
                throw error;
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

            //Insert tFormat record for every row inserted into tRow table
            let insertedtFormatId;
            const rowObjectType = objectTypeToRowId[constants.tformatColumns.rowId];
            const inserttFormatForRowQuery = {
              text: constants.inserttFormatForRowQuery,
              values: [userId, rowObjectType, savedRowEntity, userId],
            };
            try {
              const insertedtFormatRecord = await this.pool.query(inserttFormatForRowQuery);
              insertedtFormatId = insertedtFormatRecord.rows[0].Format;
            } catch (error) {
              console.error(constants.tFormatForRowError, error);
              throw error;
            }
            // Check every cell in inserted row that is present in tItemColumns or tFormatColumns to insert into tCell, tItem and tFormat
            for (
              let colIdx = constants.one;
              colIdx <= row.cellCount;
              colIdx++
            ) {
              let isTitemColumn = false;
              let isTformatColumn = false;
              let colID;
              let colDataType;
              let colDropDownSource;
              let savedCellEntity;
              const cell: any = sheet.getCell(rowIdx, colIdx).value;

              let cellValue: any = null;

              if (cell != null && cell != undefined) {
                if (typeof cell === constants.object) {
                  // Handle different object types
                  if (constants.richText in cell) {
                    // If the cell contains rich text, concatenate all the text parts
                    cellValue = cell.richText.map((part: any) => part.text).join('');
                  }
                } else {
                  // If the cell value is a simple type, use it directly
                  cellValue = cell.toString();
                }
                if (cellValue instanceof Date) {
                  // If the cell value is a Date, format it to 'YYYY-MM-DD'
                  cellValue = cellValue.toISOString().split(constants.t)[0];
                }
                // Get the header cell value for the current column index
                const headerCell = sheet.getRow(headerRowIndex).getCell(colIdx);
                let headerCellValue = headerCell.value?.toString().trim();
                // Remove trailing '*' if present
                if (headerCellValue?.endsWith(constants.star)) {
                  headerCellValue = headerCellValue.slice(
                    constants.zero,
                    constants.index,
                  ); // Remove the last character
                }

                if (headerCellValue != null || headerCellValue != undefined) {
                  for (const key in constants.titemColumns) {
                    if (constants.titemColumns[key] === headerCellValue) {
                      isTitemColumn = true;
                      break;
                    }
                  }
                  for (const key in constants.tformatColumns) {
                    if (constants.tformatColumns[key] === headerCellValue) {
                      isTformatColumn = true;
                      break;
                    }
                  }
                  if (isTitemColumn) {
                    for (const key in colData) {
                      if (
                        colData[key].colName === headerCellValue &&
                        (colData[key].pageId == pageId ||
                          colData[key].pageType == constants.eachPage)
                      ) {
                        colID = key;
                        colDataType = colData[key].colDataType;
                        colDropDownSource = colData[key].colDropDownSource;
                        break;
                      }
                    }
                    // For Default column insert tCell record with tRow.Row = 0
                    let rowEntityValue;
                    if ((constants.titemColumns.colDefaultData === headerCellValue ||
                      constants.titemColumns.valueDefaultData === headerCellValue)) {
                      rowEntityValue = constants.zero;
                    }
                    else {
                      rowEntityValue = savedRowEntity;
                    }
                    if (colID != null && savedRowEntity != null) {
                      const inserttCellQuery = {
                        text: constants.inserttCellQuery,
                        values: [colID, rowEntityValue],
                      };
                      try {
                        // Execute the insert query and return the saved cell entity
                        const result = await this.pool.query(inserttCellQuery);
                        savedCellEntity = result.rows[0];
                      } catch (error) {
                        console.error(constants.tCellRecordError, error);
                        throw error;
                      }
                      if (
                        savedCellEntity != null &&
                        savedCellEntity != undefined
                      ) {
                        if (
                          constants.titemColumns.pageType === headerCellValue ||
                          constants.titemColumns.rowType === headerCellValue ||
                          constants.titemColumns.pageEdition === headerCellValue ||
                          constants.titemColumns.colDataType === headerCellValue ||
                          constants.titemColumns.valueDataType === headerCellValue ||
                          constants.titemColumns.valueStatus === headerCellValue
                        ) {
                          const dataType = dataTypeToRowId[colDataType];
                          // Using the dropdownSource present in the page type column and cell value find the Token ID of the cell value
                          if (colDropDownSource && dataType) {
                            // Step 1: Find the row in allTokensSheet where RowType is "node" and the Token value is colDropDownSource
                            let tokenRowIndex = constants.index;
                            for (
                              let rowIndex = constants.one;
                              rowIndex <= allTokensSheet.lastRow.number;
                              rowIndex++
                            ) {
                              const row = allTokensSheet.getRow(rowIndex);
                              const rowTypeCell = row.getCell(
                                rowTypeAllTokensColIndex,
                              );
                              const tokenCell = row.getCell(tokenColStartIndex);

                              if (
                                rowTypeCell &&
                                tokenCell &&
                                constants.node.test(
                                  rowTypeCell.value?.toString(),
                                ) &&
                                tokenCell.value?.toString() ===
                                colDropDownSource
                              ) {
                                tokenRowIndex = rowIndex;
                                break;
                              }
                            }

                            if (tokenRowIndex !== constants.index) {
                              // Step 2: Retrieve the values under the found token and store them with their Row IDs
                              const tokenValueToRowIdMap: Record<
                                string,
                                string
                              > = {};
                              let toBreak = false;
                              for (
                                let rowIdx = tokenRowIndex + constants.one;
                                rowIdx <= allTokensSheet.lastRow.number;
                                rowIdx++
                              ) {
                                for (
                                  let colIndex = tokenColStartIndex;
                                  colIndex <= tokenColEndIndex;
                                  colIndex++
                                ) {
                                  const cell = allTokensSheet
                                    .getRow(rowIdx)
                                    .getCell(colIndex);
                                  if (
                                    colIndex === tokenColStartIndex &&
                                    cell.value != null &&
                                    cell.value != undefined
                                  ) {
                                    toBreak = true;
                                    break;
                                  }
                                  if (toBreak) break;
                                  if (cell && cell.value) {
                                    const tokenValue = cell.value.toString();
                                    const rowIDCell = allTokensSheet
                                      .getRow(rowIdx)
                                      .getCell(rowAllTokensColIndex);
                                    if (rowIDCell && rowIDCell.value) {
                                      const rowIDValue =
                                        rowIDCell.value.toString();
                                      tokenValueToRowIdMap[tokenValue] =
                                        rowIDValue;
                                    }
                                  }
                                }
                              }

                              // Step 3: Split cellValue and map each value to corresponding RowID
                              const cellValues = cellValue.split(constants.semicolon);
                              const matchedRowIds = cellValues
                                .map((val) => tokenValueToRowIdMap[val.trim()])
                                .filter(Boolean);

                              if (matchedRowIds.length > 0) {
                                try {
                                  // Insert corresponding tItem records and collect Item IDs
                                  const itemIds = [];
                                  for (const rowIDValue of matchedRowIds) {
                                    const inserttItemWithObjectQuery = {
                                      text: constants.inserttItemWithObjectQuery,
                                      values: [dataType, Number(rowIDValue)],
                                    }
                                    try {
                                      // Execute the insert query and return the new row ID
                                      const result = await this.pool.query(inserttItemWithObjectQuery);
                                      const insertedItemId = result.rows[0].Item;
                                      itemIds.push(insertedItemId);
                                    } catch (error) {
                                      console.error(constants.rowError, error);
                                      throw error;
                                    }
                                  }
                                  // Update the saved cell entity with the array of Item IDs
                                  await this.updateItemIdsIntCell(savedCellEntity.Cell, itemIds);
                                } catch (error) {
                                  console.error(
                                    constants.itemIdError,
                                    error,
                                  );
                                }
                              }
                            }
                          }
                        }
                        if (
                          constants.titemColumns.pageId === headerCellValue ||
                          constants.titemColumns.colId === headerCellValue
                        ) {
                          const dataType = dataTypeToRowId[colDataType];
                          try {
                            const itemIds = [];
                            const inserttItemWithObjectQuery = {
                              text: constants.inserttItemWithObjectQuery,
                              values: [dataType, Number(cellValue)],
                            }
                            try {
                              // Execute the insert query and return the new row ID
                              const result = await this.pool.query(inserttItemWithObjectQuery);
                              const insertedItemId = result.rows[0].Item;
                              itemIds.push(insertedItemId);
                            } catch (error) {
                              console.error(constants.rowError, error);
                              throw error;
                            }
                            // Update the saved cell entity with the array of Item IDs
                            await this.updateItemIdsIntCell(savedCellEntity.Cell, itemIds);
                          } catch (error) {
                            console.error(constants.itemIdError, error);
                          }
                        }
                        if (
                          constants.titemColumns.releaseDate === headerCellValue
                        ) {
                          const dataType = dataTypeToRowId[colDataType];
                          try {
                            const itemIds = [];
                            const inserttItemWithDateTimeQuery = {
                              text: constants.inserttItemWithDateTimeQuery,
                              values: [dataType, cellValue],
                            }
                            try {
                              // Execute the insert query and return the new row ID
                              const result = await this.pool.query(inserttItemWithDateTimeQuery);
                              const insertedItemId = result.rows[0].Item;
                              itemIds.push(insertedItemId);
                            } catch (error) {
                              console.error(constants.rowError, error);
                              throw error;
                            }
                            // Update the saved cell entity with the array of Item IDs
                            await this.updateItemIdsIntCell(savedCellEntity.Cell, itemIds);
                          } catch (error) {
                            console.error(constants.itemIdError, error);
                          }
                        }
                        if (constants.titemColumns.unitFactor === headerCellValue) {
                          const dataType = dataTypeToRowId[colDataType];
                          try {
                            // Insert corresponding tItem records and collect Item IDs
                            const itemIds = [];
                            const inserttItemWithNumberQuery = {
                              text: constants.inserttItemWithNumberQuery,
                              values: [dataType, Number(cellValue)],
                            }
                            try {
                              // Execute the insert query and return the new row ID
                              const result = await this.pool.query(inserttItemWithNumberQuery);
                              const insertedItemId = result.rows[0].Item;
                              itemIds.push(insertedItemId);
                            } catch (error) {
                              console.error(constants.rowError, error);
                              throw error;
                            }
                            // Update the saved cell entity with the array of Item IDs
                            await this.updateItemIdsIntCell(savedCellEntity.Cell, itemIds);
                          } catch (error) {
                            console.error(
                              constants.itemIdError,
                              error,
                            );
                          }
                        }
                        if (
                          constants.titemColumns.colDropDownSource === headerCellValue ||
                          constants.titemColumns.valueDropdownSource === headerCellValue
                        ) {
                          const dataType = dataTypeToRowId[colDataType];
                          let dropdownSource = null;
                          const cellValues = cellValue
                            .split(constants.semicolon)
                            .map((val) => val.trim())
                            .filter(Boolean);
                          if (cellValues.length > 0) {
                            try {
                              // Insert corresponding tItem records and collect Item IDs.
                              const itemIds = [];
                              for (const value of cellValues) {
                                dropdownSource = null;

                                // Check DropDown source is avaliable in All Tokens sheet
                                for (let j = tokenColStartIndex; j <= tokenColEndIndex; j++) {
                                  for (let i = headerRowIndex + constants.one; i <= allTokensSheet.lastRow.number; i++) {
                                    const row = allTokensSheet.getRow(i);
                                    const cell = row.getCell(j);
                                    if (cell.value && cell.value.toString() === value) {
                                      dropdownSource = row.getCell(rowAllTokensColIndex).value.toString();
                                      break;
                                    }
                                  }
                                  if (dropdownSource !== null) break;
                                }

                                // If not found in All Tokens sheet, check all Labels sheet
                                if (dropdownSource === null) {
                                  for (let j = labelColStartIndex; j <= labelColEndIndex; j++) {
                                    for (let i = allLabelsHeaderRowIndex + constants.one; i <= allLabelsSheet.lastRow.number; i++) {
                                      const row = allLabelsSheet.getRow(i);
                                      const cell = row.getCell(j);
                                      if (cell.value && cell.value.toString() === value) {
                                        dropdownSource = row.getCell(rowAllLabelsColIndex).value.toString();
                                        break;
                                      }
                                    }
                                    if (dropdownSource !== null) break;
                                  }
                                }
                                // If not found in all labels sheet, check all Unit sheet
                                if (dropdownSource === null){
                                  const unitHeaderIndex = await this.findHeaderRowAndColIndex(allUnitsSheet, constants.unit);
                                  const rowHeaderIndex = await this.findHeaderRowAndColIndex(allUnitsSheet, constants.rowId);
                                  for(let i = unitHeaderIndex.headerRowIndex + constants.one; i<=allUnitsSheet.lastRow.number; i++){
                                    const unitCellValue = allUnitsSheet.getCell(i, unitHeaderIndex.headerColIndex);
                                    if(unitCellValue.value && unitCellValue.value.toString() === value){
                                      dropdownSource = allUnitsSheet.getCell(i, rowHeaderIndex.headerColIndex).value.toString();
                                    }
                                  }
                                }
                                // If not found then check all the section-Head Rows key value pair
                                if (dropdownSource === null) {
                                  dropdownSource = dropdownSourceKeyValuePairs[value];
                                }
                               
                                // Process found dropdownSource
                                if (dataType !== null && dropdownSource !== null && dropdownSource !== undefined && ddsTypeRowID !== null) {
                                  const json = JSON.stringify({
                                    [ddsTypeRowID]: dropdownSource,
                                  });
                                  const insertedItemId = await this.insertItemWithJson(dataType, json);
                                  itemIds.push(insertedItemId);
                                }
                              }

                              // Update the saved tCell record with the array of Item IDs
                              if (itemIds.length > 0) {
                                await this.updateItemIdsIntCell(savedCellEntity.Cell, itemIds);
                              } else {
                                console.error(constants.noItemIdtoUpdatetCellError);
                              }
                            } catch (error) {
                              console.error(constants.itemIdError, error);
                            }
                          }
                        }

                        if (
                          constants.titemColumns.pageName === headerCellValue ||
                          constants.titemColumns.pageSEO === headerCellValue ||
                          constants.titemColumns.colName === headerCellValue ||
                          constants.titemColumns.language === headerCellValue ||
                          constants.titemColumns.region === headerCellValue ||
                          constants.titemColumns.supplier === headerCellValue ||
                          constants.titemColumns.token === headerCellValue ||
                          constants.titemColumns.model === headerCellValue ||
                          constants.titemColumns.unit === headerCellValue ||
                          constants.titemColumns.labels === headerCellValue ||
                          constants.titemColumns.valueFormula === headerCellValue ||
                          constants.titemColumns.colDefaultData === headerCellValue ||
                          constants.titemColumns.valueDefaultData === headerCellValue
                        ) {
                          const dataType = dataTypeToRowId[colDataType];
                          // Split cellValue and insert each split value into tItem
                          const cellValues = cellValue
                            .split(constants.semicolon)
                            .map((val) => val.trim())
                            .filter(Boolean);

                          if (cellValues.length > 0) {
                            try {
                              // Insert corresponding tItem records and collect Item IDs
                              const itemIds = [];
                              for (const value of cellValues) {
                                const json = JSON.stringify({
                                  [englishRowId]: value,
                                });
                                const insertedItemId = await this.insertItemWithJson(dataType, json);
                                itemIds.push(insertedItemId);
                              }

                              // Update the saved cell entity with the array of Item IDs
                              await this.updateItemIdsIntCell(savedCellEntity.Cell, itemIds);
                            } catch (error) {
                              console.error(
                                constants.itemIdError,
                                error,
                              );
                            }
                          }
                        }
                        if (constants.titemColumns.pageURL === headerCellValue) {
                          const dataType = dataTypeToRowId[colDataType];
                          try {
                            const itemIds = [];
                            // Insert corresponding tItem records and collect Item IDs
                            const json = JSON.stringify({
                              [urlTypeRowID]: cellValue,
                            });
                            const insertedItemId = await this.insertItemWithJson(dataType, json);
                            itemIds.push(insertedItemId);
                            // Update the saved cell entity with the array of Item IDs
                            await this.updateItemIdsIntCell(savedCellEntity.Cell, itemIds);
                          } catch (error) {
                            console.error(
                              constants.itemIdError,
                              error,
                            );
                          }
                        }
                      }
                    }
                  }
                  if (isTformatColumn) {
                    if(constants.tformatColumns.rowComment === headerCellValue && insertedtFormatId !== null && insertedtFormatId !== undefined){
                      const updateQuery = constants.updateAnyColumnsIntFormatQuery(constants.comment);
                      const json = JSON.stringify({
                        [englishRowId]: cellValue,
                      });

                      // Construct the query object for updating tFormat with Comment column
                      const updatetFormatColumnQuery = {
                        text: updateQuery,
                        values: [json, insertedtFormatId],
                      };
                      try{
                        await this.pool.query(updatetFormatColumnQuery);
                      }catch(error){
                        console.error(constants.tFormatUpdateError, constants.comment, error,);
                      }
                    }
                    if(constants.tformatColumns.rowStatus === headerCellValue && insertedtFormatId !== null && insertedtFormatId !== undefined){
                      const cellValues = cellValue
                            .split(constants.semicolon)
                            .map((val) => val.trim())
                            .filter(Boolean);
                      if (cellValues.length > 0) {
                        const statusIds = [];
                        for (const value of cellValues) {
                          statusIds.push(statusesToRowId[value]);
                        }
                      const updateQuery = constants.updateAnyColumnsIntFormatQuery(constants.status);
                      // Construct the query object for updating tFormat with Comment column
                      const updatetFormatColumnQuery = {
                        text: updateQuery,
                        values: [statusIds, insertedtFormatId],
                      };
                      try{
                        await this.pool.query(updatetFormatColumnQuery);
                      }catch(error){
                        console.error(constants.tFormatUpdateError, constants.status, error,);
                      }
                      }
                    }
                    if(constants.tformatColumns.rowStatus === headerCellValue && insertedtFormatId !== null && insertedtFormatId !== undefined){

                    }
                  }
                }
              }
            }
          }
          // Update sibling rows to null for lastChildRow
          for (let key in lastRowAtLevel) {
            const rowId = lastRowAtLevel[key].id;

            const updateSiblingRowIntRowToNull = {
              text: constants.updateSiblingRowIntRowToNull,
              values: [rowId],
            }

            try {
              // Execute the update query
              await this.pool.query(updateSiblingRowIntRowToNull);
            } catch (error) {
              console.error(constants.updatingSiblingRowToNullError, error);
              throw error;
            }
          }
        }
      }
      await this.pool.query(constants.enableForeignKeyQuery);
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
  // Method to Generate the next Row value from the last Row.
  async getNextRowValue() {
    const getLastRowIdQuery = { text: constants.getLastRowId };

    try {
      const result = await this.pool.query(getLastRowIdQuery);
      const lastRow = result.rows[0];
      return lastRow ? parseInt(lastRow.Row) + constants.one : constants.one;
    } catch (error) {
      console.error(constants.lastRowFetchingError, error);
      throw error;
    }
  }
  // Method to Update the ItemIds into tCell table.
  async updateItemIdsIntCell(cellId: number, newItemIds: number[]) {
    const gettCellQuery = {
      text: constants.gettCellQuery,
      values: [cellId],
    };

    try {
      const result = await this.pool.query(gettCellQuery);
      const currentItems = result.rows[0]?.Items || [];

      // Append the new ItemIDs to the array
      const updatedItems = [...currentItems, ...newItemIds];

      const updateItemIdsIntCellQuery = {
        text: constants.updateItemIdsIntCellQuery,
        values: [updatedItems, cellId],
      };

      // Execute the update query
      await this.pool.query(updateItemIdsIntCellQuery);
    } catch (error) {
      console.error(constants.tCellUpdateError, error);
      throw error;
    }
  }
  // Method to Insert tItem table into JSON column.
  async insertItemWithJson(dataType: number, json: string) {
    const insertItemWithJsonQuery = {
      text: constants.inserttItemWithJsonQuery,
      values: [dataType, json],
    }
    try {
      // Execute the insert query and return the new row ID
      const result = await this.pool.query(insertItemWithJsonQuery);
      return result.rows[0].Item;
    } catch (error) {
      console.error(constants.rowError, error);
      throw error;
    }
  }
  // Method to find the Token ID and Value for any DDS header.
  async findValuesAndRowIdInAllTokens(sheet:any, headerRowIndex: number, headerColIndex: number, tokenColEndIndex: number, rowAllTokensColIndex: number){
    let shouldBreak = false;
    const value =[];
    const rowIdOfValue = [];
    for (
      let i = headerRowIndex + constants.one;
      i <= sheet.lastRow.number;
      i++
    ) {
      const row = sheet.getRow(i);
      for (let j = headerColIndex; j <= tokenColEndIndex; j++) {
        const cell = row.getCell(j);
        let tokenValue;
        if (cell.value != null || cell.value != undefined) {
          tokenValue = cell.value.toString();
        }
  
        // Check if there's a corresponding RowId value in the same row
        const rowCell = row.getCell(rowAllTokensColIndex);
        const rowValue = rowCell ? rowCell.value : null;
  
        // Break if a value is found in the same column index as "DataType"
        if (
          j === headerColIndex &&
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
          value.push(tokenValue);
          rowIdOfValue.push(rowValue.toString());
        }
      }
    }
    return {value, rowIdOfValue};
  }
  async findHeaderRowAndColIndex(sheet:any, header: any){
    let headerRowIndex;
    let headerColIndex;
    for (let i = constants.one; i <= sheet.lastRow.number; i++) {
      const row = sheet.getRow(i);
      for (let j = constants.one; j <= row.cellCount; j++) {
        const cell = row.getCell(j);
        if (cell.value && header.test(cell.value.toString())) {
          headerRowIndex = i;
          headerColIndex = j;
          break;
        }
      }
    }
    return {headerRowIndex, headerColIndex};
  }
}
