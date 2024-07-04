import { TPg } from './entities/TPg';
import { TFormat } from './entities/TFormat';
import { TRow } from './entities/TRow';
import { TCell } from './entities/TCell';
import { TCol } from './entities/TCol';
import { TItem } from './entities/TItem';
import { TTx } from './entities/TTx';
import { TUser } from './entities/TUser';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Password@1',
  database: 'AIC_AutoScript',
  entities: [TPg, TFormat, TRow, TCell, TCol, TItem, TTx, TUser],
  synchronize: false,
  ssl: false,
};
