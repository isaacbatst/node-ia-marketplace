import { Module } from '@nestjs/common';
import { ShoppingService } from './shopping.service';
import { PostgresService } from '../shared/infra/postgres.service';
import { CatalogModule } from '../catalog/catalog.module';
import { ShoppingController } from './shopping.controller';

@Module({
  imports: [CatalogModule],
  controllers: [ShoppingController],
  providers: [ShoppingService, PostgresService],
})
export class ShoppingModule {}
