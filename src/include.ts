// constants.ts

export const constants = {
  // Each Page Column headers name
  rowId: /Row\*/i,
  rowType: /Row Type/i,
  rowStatus: /Row Status/i,

  // All Pages sheet Column headers name
  pageIdMandatory: /Page Id\*/i,
  pageName: /Page Name\*/i,
  pageType: /Page Type/i,

  // All Cols sheet Column headers name
  colIdPattern: /Col Id\*/i,
  pageIdPattern: /Page Id/i,
  colNamePattern: /Col Name\*/i,
  colDataType: /Col DataType\*/i,
  colDropDownSource: /Col DropDownSource/i,
  language: /Language\*/i,

  // Columns to insert in tCell and tItem table
  titemColumns: {
    rowType: 'Row Type',
    pageName: 'Page Name',
    pageType: 'Page Type',
    pageEdition: 'Page Edition',
    pageURL: 'Page URL',
    pageSEO: 'Page SEO',
    colId: 'Col Id',
    pageId: 'Page Id',
    colName: 'Col Name',
    colDataType: 'Col DataType',
    colDropDownSource: 'Col DropDownSource',
    colDefaultData: 'Col DefaultData',
    token: 'Token',
    language: 'Language',
    region: 'Region',
    supplier: 'Supplier',
    model: 'Model',
    releaseDate: 'Release Date',
    unit: 'Unit',
    unitFactor: 'Unit Factor',
    labels: 'Labels',
    valueDataType: 'Value Data Type',
    valueDropdownSource: 'Value DropDownSource',
    valueDefaultData: 'Value DefaultData',
    valueStatus: 'Value Status',
    valueFormula: 'Value Formula',
  },

  // Columns to insert in tFormat table
  tformatColumns: {
    rowId: 'Row',
    rowStatus: 'Row Status',
    rowComment: 'Row Comment',
    pageId: 'Page Id',
    pageOwner: 'Page Owner',
    pageStatus: 'Page Status',
    pageComment: 'Page Comment',
    colId: 'Col Id',
    colDefaultData: 'Col DefaultData',
    colFormula: 'Col Formula',
    colStatus: 'Col Status',
    colOwner: 'Col Owner',
    colComment: 'Col Comment',
    valueDefaultData: 'Value DefaultData',
  },

  // Page names
  allPages: 'All Pages',
  allCols: 'All Cols',
  allTokens: 'All Tokens',
  allLabels: 'All Labels',

  // Section head & Each page
  sectionHead: 'Section-Head',
  eachPage: 'Each Page',
  dataType: /Data Type/i,
  tokenPattern: /Token\*/i,
  node: /Node/i,
  dds: 'DDS-Type',
  allLanguages: 'All Languages',
  english: 'English',
  urltype: 'URL Type',
  ddstype: 'DDS-Type',
  label: /Labels\*/i,
  object: 'object',
  richText: 'richText',
  


  // Sheets to insert into Database
  sheetNames: [
    'All Pages',
    'All Cols',
    'All Tokens',
    'All Languages',
    'All Regions',
    'All Suppliers',
    'All Models',
    'All Units',
    'All Labels',
  ],

  // Nested columns to find the Row Level in tRow table
  nestedColumns: {
    'All Pages': /Page Name\*/,
    'All Cols': /Col Name\*/,
    'All Tokens': /Token\*/,
    'All Languages': /Language\*/,
    'All Regions': /Region\*/,
    'All Suppliers': /Supplier\*/,
    'All Models': /Model\*/,
    'All Units': /Unit\*/,
    'All Labels': /Labels\*/,
  },

  // Miscellaneous constants
  index: -1,
  one: 1,
  zero: 0,
  star: '*',
  semicolon: ';',
  t: 'T',

  // Error and success messages
  successMessage: 'Excel file processed successfully ',
  process: 'Processing sheet: ',
  serverError: 'Internal server error ',
  rowError: 'Error inserting row: ',
  lastRowFetchingError : 'Error fetching next row value: ',
  emptyRowError: 'Error: Saved row entity does not have a row value ',
  rowStatusError: 'Row-Status column not found in sheet ',
  pageIdError: 'does not exist in the referenced table ',
  headerError: 'Header row not found in sheet ',
  allColsError: 'All Cols Sheet not found ',
  allTokenIndexError: 'Token column start or end and row not found in sheet ',
  allLabelsIndexError: 'Label column start or end and row not found in sheet ',
  datatypeError: 'DataType row not found in sheet ',
  tCellUpdateError: 'Error updating ItemIDs in tCell record:',
  itemIdError: 'Error processing Item IDs:',
  updatingSiblingRowToNullError: 'Error updating siblingRow to null: ',
  tCellRecordError: 'Error saving tCell record:',
  noItemIdtoUpdatetCellError: 'No item IDs found to update tCell',

  //Sql query texts
    disableForeignKeyQuery : `ALTER TABLE "tRow" DISABLE TRIGGER ALL; ALTER TABLE "tItem" DISABLE TRIGGER ALL;`,
    enableForeignKeyQuery : `ALTER TABLE "tRow" ENABLE TRIGGER ALL; ALTER TABLE "tItem" ENABLE TRIGGER ALL;`,
    inserttColQuery :  `INSERT INTO public."tCol" ("Col") VALUES ($1)`,
    insertDefaulttRowQuery : `INSERT INTO public."tRow" ("Row", "RowLevel") VALUES($1, $2) RETURNING "Row"`,
    inserttPgQuery : `INSERT INTO public."tPg" ("Pg") VALUES ($1)`,
    getLastRowId : `SELECT "Row" FROM public."tRow" ORDER BY "Row" DESC LIMIT 1`,
    inserttRowQuery :  `INSERT INTO public."tRow" ("Row", "Pg","RowLevel", "ParentRow") VALUES($1, $2, $3, $4) RETURNING "Row"`,
    updateSiblingRowIntRowQuery : `UPDATE public."tRow" SET "SiblingRow" = $1 WHERE "Row" = $2`,
    inserttCellQuery :  `INSERT INTO public."tCell" ("Col", "Row") VALUES ($1, $2) RETURNING *`,
    inserttItemWithObjectQuery : `INSERT INTO public."tItem" ("DataType", "Object") VALUES($1, $2) RETURNING "Item"`,
    gettCellQuery : `SELECT "Items" FROM public."tCell" WHERE "Cell" = $1`,
    updateItemIdsIntCellQuery : `UPDATE public."tCell" SET "Items" = $1 WHERE "Cell" = $2`,
    inserttItemWithDateTimeQuery : `INSERT INTO public."tItem" ("DataType", "DateTime") VALUES($1, $2) RETURNING "Item"`,
    inserttItemWithNumberQuery : `INSERT INTO public."tItem" ("DataType", "Num") VALUES($1, $2) RETURNING "Item"`,
    insertItemWithJsonQuery :  `INSERT INTO public."tItem" ("DataType", "JSON") VALUES($1, $2) RETURNING "Item"`,
    updateSiblingRowIntRowToNull :  `UPDATE public."tRow" SET "SiblingRow" = NULL WHERE "Row" = $1`,
};
