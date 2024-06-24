import { Pool } from 'pg';

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
