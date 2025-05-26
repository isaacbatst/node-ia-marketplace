import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PostgresService } from '../shared/postgres.service';

@Module({
  imports: [],
  controllers: [CartController],
  providers: [CartService, PostgresService],
  exports: [],
})
export class CartModule {}
