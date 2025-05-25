import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { PostgresService } from '../shared/infra/postgres.service';

@Module({
  imports: [],
  exports: [CatalogService],
  controllers: [CatalogController],
  providers: [CatalogService, PostgresService],
})
export class CatalogModule {}
