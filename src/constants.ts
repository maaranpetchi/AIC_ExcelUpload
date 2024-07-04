import { TPg } from './entities/TPg';
import { TFormat } from './entities/TFormat';
import { TRow } from './entities/TRow';
import { TCell } from './entities/TCell';
import { TCol } from './entities/TCol';
import { TItem } from './entities/TItem';
import { TTx } from './entities/TTx';
import { TUser } from './entities/TUser';

export const constants = {
    pageIdMandatoryPattern: /Page Id\*/i,
    pageIdPattern: /Page Id/i,
    colIdPattern: /Col Id\*/i,
    colNamePattern: /Col Name\*/i,
    pageNamePattern: /Page Name\*/i,
    pageTypePattern: /Page Type/i,
    rowIdPattern: /Row\*/i,
    tokenPattern: /Token\*/i,
    rowType: /Row Type/i,
    rowStatus: /Row Status/i,
    allPages: "All Pages",
    allcols: "All Cols",
    allTokens: "All Tokens",
    sectionHead: "Section-Head",
    sheetNames: ["All Pages", "All Cols", "All Tokens", "All Languages", "All Regions", "All Suppliers", "All Models", "All Units", "All Labels"],
    nestedColumns: {
      "All Pages": /Page Name\*/,
      "All Cols" : /Col Name\*/,
      "All Tokens": /Token\*/,
      "All Languages": /Language\*/,
      "All Regions": /Region\*/,
      "All Suppliers": /Supplier\*/,
      "All Models": /Model\*/,
      "All Units": /Unit\*/,
      "All Labels": /Labels\*/, 
    },
    index: -1,
    one: 1,
    zero: 0,
    siblingRowCondition: "row = :siblingRowId",
    lastSiblingCondition: "row = :rowId",
    successMessage: 'Excel file processed successfully',
    serverError: 'Internal server error',
    rowError: 'Error inserting row:',
    emptyRowError: 'Error: Saved row entity does not have a row value',
    rowStatusError: 'Row-Status column not found in sheet',
    pageIdError: 'does not exist in the referenced table',
    headerError: 'Header row not found in sheet',
    tRow: "TRow.Row",
    typeORMFeature: [TPg, TFormat, TRow,TCell,TCol,TItem,TTx,TUser]
  };
