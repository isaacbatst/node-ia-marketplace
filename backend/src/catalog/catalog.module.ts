import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { PostgresService } from '../shared/postgres.service';

@Module({
  imports: [],
  controllers: [CatalogController],
  providers: [CatalogService, PostgresService],
  exports: [],
})
export class CatalogModule {}
