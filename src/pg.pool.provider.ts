import { Pool } from 'pg';
 
export const pgPoolProvider = {
  provide: 'PG_POOL',
  useFactory: async () => {
    const pool = new Pool({
      user: 'postgres',
      host: 'aicdesignmgm.postgres.database.azure.com',
      database: 'postgres',
      password: 'AdENg+8[ZY',
      port: 5432,
      searchPath: 'public',
 
    });
    return pool;
  },
};
 