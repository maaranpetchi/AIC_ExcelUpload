
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'aicdesignmgm.postgres.database.azure.com',
  port: 5432,
  username: 'postgres',
  password: 'AdENg+8[ZY',
  database: 'postgres',
  entities: [],
  ssl: {
    rejectUnauthorized: false, // This can be true if you have the CA cert
  },
};
