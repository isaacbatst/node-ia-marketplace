import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { PostgresService } from '../shared/postgres.service';
import { LlmService } from '@/shared/llm.service';

@Module({
  imports: [],
  controllers: [CatalogController],
  providers: [CatalogService, PostgresService, LlmService],
  exports: [CatalogService],
})
export class CatalogModule {}
