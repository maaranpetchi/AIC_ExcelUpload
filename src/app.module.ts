import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './databaseConfig';
import { constants } from './constants';
@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig,),
    TypeOrmModule.forFeature(constants.typeORMFeature),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}