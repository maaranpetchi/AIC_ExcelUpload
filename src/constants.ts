export class Constants {
  // Each Page Column headers name
  static readonly rowId = /Row\*/i;
  static readonly rowType = /Row Type/i;
  static readonly rowStatus = /Row Status/i;

  // All Pages sheet Column headers name
  static readonly pageIdMandatory = /Page Id\*/i;
  static readonly pageName = /Page Name\*/i;
  static readonly pageType = /Page Type/i;

  // All Cols sheet Column headers name
  static readonly colIdPattern = /Col Id\*/i;
  static readonly pageIdPattern = /Page Id/i;
  static readonly colNamePattern = /Col Name\*/i;
  static readonly colDataType = /Col DataType\*/i;
  static readonly colDropDownSource = /Col DropDownSource/i;
  static readonly language = /Language\*/i;

  // Columns to insert in tCell and tItem table
  static readonly titemColumns = {
    rowType: /Row Type/i,
    pageName: /Page Name/i,
    pageType: /Page Type/i,
    pageEdition: /Page Edition/i,
    pageURL: /Page URL/i,
    pageSEO: /Page SEO/i,
    colId: /Col Id/i,
    pageId: /Page Id/i,
    colName: /Col Name/i,
    colDataType: /Col DataType/i,
    colDropDownSource: /Col DropDownSource/i,
    colDefaultData: /Col DefaultData/i,
    token: /Token/i,
    language: /Language/i,
    region: /Region/i,
    supplier: /Supplier/i,
    model: /Model/i,
    releaseDate: /Release Date/i,
    unit: /Unit/i,
    unitFactor: /Unit Factor/i,
    labels: /Labels/i,
    valueDataType: /Value Data Type/i,
    valueDropdownSource: /Value DropDownSource/i,
    valueDefaultData: /Value DefaultData/i,
    valueStatus: /Value Status/i,
    valueFormula: /Value Formula/i,
  };

  // Columns to insert in tFormat table
  static readonly tformatColumns = {
    rowId: /Row/i,
    rowStatus: /Row Status/i,
    rowComment: /Row Comment/i,
    pageId: /Page Id/i,
    pageOwner: /Page Owner/i,
    pageStatus: /Page Status/i,
    pageComment: /Page Comment/i,
    colId: /Col Id/i,
    colDefaultData: /Col DefaultData/i,
    colFormula: /Col Formula/i,
    colStatus: /Col Status/i,
    colOwner: /Col Owner/i,
    colComment: /Col Comment/i,
    valueDefaultData: /Value DefaultData/i,
  };

  // Page names
  static readonly allPages = 'All Pages';
  static readonly allCols = 'All Cols';
  static readonly allTokens = 'All Tokens';

  // Section head & Each page
  static readonly sectionHead = 'Section-Head';
  static readonly eachPage = 'Each Page';
  static readonly dataType = /Data Type/i;
  static readonly tokenPattern = /Token\*/i;
  static readonly node = /Node/i;
  static readonly dds = 'DDS-Type';
  static readonly allLanguages = 'All Languages';
  static readonly english = 'English';
  static readonly urltype = 'URL Type';

  // Sheets to insert into Database
  static readonly sheetNames = [
    'All Pages',
    'All Cols',
    'All Tokens',
    'All Languages',
    'All Regions',
    'All Suppliers',
    'All Models',
    'All Units',
    'All Labels',
  ];

  // Nested columns to find the Row Level in tRow table
  static readonly nestedColumns = {
    'All Pages': /Page Name\*/,
    'All Cols': /Col Name\*/,
    'All Tokens': /Token\*/,
    'All Languages': /Language\*/,
    'All Regions': /Region\*/,
    'All Suppliers': /Supplier\*/,
    'All Models': /Model\*/,
    'All Units': /Unit\*/,
    'All Labels': /Labels\*/,
  };

  // Miscellaneous constants
  static readonly index = -1;
  static readonly one = 1;
  static readonly zero = 0;
  static readonly star = '*';

  // Error and success messages
  static readonly successMessage = 'Excel file processed successfully ';
  static readonly process ='Processing sheet: '
  static readonly serverError = 'Internal server error ';
  static readonly rowError = 'Error inserting row: ';
  static readonly emptyRowError = 'Error: Saved row entity does not have a row value ';
  static readonly rowStatusError = 'Row-Status column not found in sheet ';
  static readonly pageIdError = 'does not exist in the referenced table ';
  static readonly headerError = 'Header row not found in sheet ';
  static readonly allColsError = 'All Cols Sheet not found ';
  static readonly allTokenIndexError ='Token column start or end and row not found in sheet ';
  static readonly datatypeError ='DataType row not found in sheet ';

  // Static method to insert a page ID into the tPg table
  static async insertPg(pool: any, PG: number) {
    const query = { 
      text: `INSERT INTO public."tPg" ("Pg") VALUES ($1)`,
       values: [PG]
       };
    // Execute the query on the provided pool
    await pool.query(query);
  }

   // static method to find a page ID in the tPg table
   static async findPg(pool: any, pageId: number) {
    const query = {
      text: `SELECT * FROM public."tPg" WHERE "Pg" = $1`,
      values: [pageId],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  // Static method to insert a column ID into the tCol table
  static async insertCol(pool: any, colId: number) {
    if (colId !== null && colId !== undefined) {
      const query = { 
        text: `INSERT INTO public."tCol" ("Col") VALUES ($1)`,
         values: [colId] 
        };
      await pool.query(query);
    }
  }

  // Static method to insert the record into the tRow table
  static async insertRow(pool:any, row: number, pg: number, rowLevel: number, parentRow: number){
    const query = {
      text: `INSERT INTO public."tRow" ("Row", "Pg","RowLevel", "ParentRow") VALUES($1, $2, $3, $4) RETURNING "Row"`,
      values: [row, pg, rowLevel, parentRow]
    };
    try {
      // Execute the insert query and return the new row ID
      const result = await pool.query(query);
      return result.rows[0].Row;
    } catch (error) {
      console.error(this.rowError, error);
      throw error;
    }
  }

   // Static method to get the next row value using pool
   static async getNextRowValue(pool: any) {
    const query = {
      text: `SELECT "Row" FROM public."tRow" ORDER BY "Row" DESC LIMIT 1`,
    };

    try {
      const result = await pool.query(query);
      const lastRow = result.rows[0];
      return lastRow ? parseInt(lastRow.Row) + Constants.one : Constants.one;
    } catch (error) {
      console.error('Error fetching next row value:', error);
      throw error;
    }
  }

  // Static method to execute the update query for sibling row in t-Row table
  static async updateSiblingRow(pool: any, siblingRowId: number, newRowId: number) {
    if (siblingRowId !== null) {
      const query = {
      text: `UPDATE public."tRow" SET "SiblingRow" = $1 WHERE "Row" = $2`,
      values: [newRowId, siblingRowId],
      };
      try {
        // Execute the update query
        await pool.query(query);
          } catch (error) {
        console.error('Error updating sibling row:', error);
        throw error;
      }
    }
  }

  // Static method to execute the insert query for t-Cell table
  static async insertCell(pool: any, col: any, row: any) {
    const query ={ text: `INSERT INTO public."tCell" ("Col", "Row") 
    VALUES ($1, $2)
    RETURNING *`,
    values: [col, row],
    };
    try {
      // Execute the insert query and return the saved cell entity
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving tCell record:', error);
      throw error;
    }
  }

   // Static method to execute the update query for setting siblingRow to null
   static async updateSiblingRowToNull(pool: any, rowId: any) {
    const query = {
      text: `UPDATE public."tRow" 
              SET "SiblingRow" = NULL 
             WHERE "Row" = $1`,
    values: [rowId],
    }

    try {
      // Execute the update query
      await pool.query(query);
    } catch (error) {
      console.error('Error updating siblingRow to null:', error);
      throw error;
    }
  }

  //Static method to execute the insert query for tItem table
  static async insertItem(pool:any, dataType: number, object: number ){
    const query = {
      text: `INSERT INTO public."tItem" ("DataType", "Object")
            VALUES($1, $2) RETURNING "Item"`,
      values: [dataType, object],
    }
    try {
      // Execute the insert query and return the new row ID
      const result = await pool.query(query);
      return result.rows[0].Item;
    } catch (error) {
      console.error(this.rowError, error);
      throw error;
    }
  }

  //Static method to execute the insert query for tItem table
  static async insertJsonItem(pool:any, dataType: number, json: string ){
    const query = {
      text: `INSERT INTO public."tItem" ("DataType", "JSON")
            VALUES($1, $2) RETURNING "Item"`,
      values: [dataType, json],
    }
    try {
      // Execute the insert query and return the new row ID
      const result = await pool.query(query);
      return result.rows[0].Item;
    } catch (error) {
      console.error(this.rowError, error);
      throw error;
    }
  }

  //Static method to execute the insert query for tItem table
  static async insertDateItem(pool:any, dataType: number, dateTime: string ){
    const query = {
      text: `INSERT INTO public."tItem" ("DataType", "DateTime")
            VALUES($1, $2) RETURNING "Item"`,
      values: [dataType, dateTime],
    }
    try {
      // Execute the insert query and return the new row ID
      const result = await pool.query(query);
      return result.rows[0].Item;
    } catch (error) {
      console.error(this.rowError, error);
      throw error;
    }
  }

  // Static method to update the ItemIDs array in the tCell table
static async updateCellItemIDs(pool: any, cellId: number, newItemIds: number[]) {
  const queryFetch = {
    text: `SELECT "Items" FROM public."tCell" WHERE "Cell" = $1`,
    values: [cellId],
  };

  try {
    const result = await pool.query(queryFetch);
    const currentItems = result.rows[0]?.Items || [];

    // Append the new ItemIDs to the array
    const updatedItems = [...currentItems, ...newItemIds];

    const queryUpdate = {
      text: `UPDATE public."tCell" SET "Items" = $1 WHERE "Cell" = $2`,
      values: [updatedItems, cellId],
    };

    // Execute the update query
    await pool.query(queryUpdate);
  } catch (error) {
    console.error('Error updating ItemIDs in tCell record:', error);
    throw error;
  }
}


}
