import { tPg } from './entities/tPg';
import { tFormat } from './entities/tFormat';
import { tRow } from './entities/tRow';
import { tCell } from './entities/tCell';
import { tCol } from './entities/tCol';
import { tItem } from './entities/tItem';
import { tTx } from './entities/tTx';
import { tUser } from './entities/tUser';

export const constants = {
  //Each Page Column headers name
  rowId: /Row\*/i,
  rowType: /Row Type/i,
  rowStatus: /Row Status/i,

  //All Pages sheet Column headers name
  pageIdMandatory: /Page Id\*/i,
  pageName: /Page Name\*/i,
  pageType: /Page Type/i,

  //All Cols sheet Column headers name
  colIdPattern: /Col Id\*/i,
  pageIdPattern: /Page Id/i,
  colNamePattern: /Col Name\*/i,

  //Columns to insert in tCell and tItem table
  titemColumns: {
    //Each Page Column headers name
    rowType: /Row Type/i,

    //All Pages sheet Column headers name
    pageIdMandatory: /Page Id\*/i,
    pageName: /Page Name\*/i,
    pageType: /Page Type/i,
    pageEdition: /Page Edition\*/i,
    pageOwner: /Page Owner\*/i,
    pageURL: /Page URL/i,
    pageSEO: /Page SEO/i,

    //All Cols sheet Column headers name
    colIdPattern: /Col Id\*/i,
    pageIdPattern: /Page Id/i,
    colNamePattern: /Col Name\*/i,
    colDataType: /Col DataType\*/i,
    colDropDownSource: /Col DropDownSource/i,
    colDefaultData: /Col DefaultData/i,

    //All Tokens sheet Column headers name
    tokenPattern: /Token\*/i,

    //All Languages sheet Column headers name
    language: /Language\*/i,

    //All Regions sheet Column headers name
    region: /Region\*/i,

    //All Suppliers sheet Column headers name
    supplier: /Supplier\*/i,

    //All Models sheet Column headers name
    model: /Model\*/i,
    releaseData: /Release Date/i,

    //All Units sheet Column headers name
    unit: /Unit\*/i,
    unitFactor: /Unit Factor/i,

    //All Labels sheet Column headers name
    labels: /Labels\*/i,
    valueDataType: /Value DataType/i,
    valueDropdownSource: /Value DropDownSource/i,
    valueDefaultData: /Value DefaultData/i,
    valueStatus: /Value Status/i,
    valueFormula: /Value Formula/i,
  },
  //Columns to insert in tFormat table
  tformatColumns: {
    //Each Page Column headers name
    rowId: /Row\*/i,
    rowStatus: /Row Status/i,
    rowComment: /Row Comment/i,

    //All Pages sheet Column headers name
    pageIdMandatory: /Page Id\*/i,
    pageOwner: /Page Owner\*/i,
    pageStatus: /Page Status/i,
    pageComment: /Page Comment/i,

    //All Cols sheet Column headers name
    colIdPattern: /Col Id\*/i,
    colDefaultData: /Col DefaultData/i,
    colFormula: /Col Formula/i,
    colStatus: /Col Status/i,
    colOwner: /Col Owner/i,
    colComment: /Col Comment/i,

    //All Labels sheet Column headers name
    valueDefaultData: /Value DefaultData/i,
  },
  //Page names
  allPages: 'All Pages',
  allcols: 'All Cols',
  allTokens: 'All Tokens',

  //Section head
  sectionHead: 'Section-Head',

  //Sheets to insert into Database
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

  //Nested columns to find the Row Level in tRow table
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
  index: -1,
  one: 1,
  zero: 0,
  
  //Error and success message
  successMessage: 'Excel file processed successfully',
  serverError: 'Internal server error',
  rowError: 'Error inserting row:',
  emptyRowError: 'Error: Saved row entity does not have a row value',
  rowStatusError: 'Row-Status column not found in sheet',
  pageIdError: 'does not exist in the referenced table',
  headerError: 'Header row not found in sheet',
  allcolsError: 'All Cols Sheet not found',

  //Entities used in typeORM
  typeORMFeature: [tPg, tFormat, tRow, tCell, tCol, tItem, tTx, tUser],
};
