import { tPg } from './entities/tPg';
import { tFormat } from './entities/tFormat';
import { tRow } from './entities/tRow';
import { tCell } from './entities/tCell';
import { tCol } from './entities/tCol';
import { tItem } from './entities/tItem';
import { tTx } from './entities/tTx';
import { tUser } from './entities/tUser';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Password@1',
  database: 'AIC_AutoScript',
  entities: [tPg, tFormat, tRow, tCell, tCol, tItem, tTx, tUser],
  synchronize: false,
  ssl: false,
};
