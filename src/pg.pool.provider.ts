import { Pool } from 'pg';

export const pgPoolProvider = {
  provide: 'PG_POOL',
  useFactory: async () => {
    const pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres',
      password: 'password@1',
      port: 5432,
      searchPath: 'public', // or the actual schema name

    });
    return pool;
  },
};
