import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './databaseConfig';
import { pgPoolProvider } from './pg.pool.provider';
@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig,),
    TypeOrmModule.forFeature([]),
  ],
  controllers: [AppController],
  providers: [AppService, pgPoolProvider],
})
export class AppModule {
}