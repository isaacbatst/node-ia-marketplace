import { Module } from '@nestjs/common';
import { LlmModule } from '../shared/llm/llm.module';
import { PostgresService } from '../shared/postgres.service';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [LlmModule],
  controllers: [CatalogController],
  providers: [CatalogService, PostgresService],
  exports: [CatalogService],
})
export class CatalogModule {}
