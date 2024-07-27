import { Pool } from 'pg';
 
// export const pgPoolProvider = {
//   provide: 'PG_POOL',
//   useFactory: async () => {
//     const pool = new Pool({
//       user: 'azuresu',
//       host: 'aicdesignmgm.postgres.database.azure.com',
//       database: 'postgres',
//       password: 'Krypto$@123',
//       port: 5432,
//       searchPath: 'public',
//       ssl: {
//         rejectUnauthorized: false,
//       },
//     });
//     return pool;
//   },
// };

export const pgPoolProvider = {
  provide: 'PG_POOL',
  useFactory: async () => {
    const pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'AIC_AutoScript',
      password: 'Password@1',
      port: 5432,
      searchPath: 'public',
    });
    return pool;
  },
};
 