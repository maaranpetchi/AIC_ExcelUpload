import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { pgPoolProvider } from './pg.pool.provider';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: "localhost",
      port: 5432,
      username: 'postgres',
      password: 'password@1',
      database: 'postgres',
      entities: [],
      synchronize: false,
      ssl:false
    }),
    TypeOrmModule.forFeature([]), // Add other entities as necessary

  ],
  controllers: [AppController],
  providers: [AppService,pgPoolProvider],
})
export class AppModule {

}