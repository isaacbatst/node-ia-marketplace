import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { ShoppingService } from './shopping.service';

@Controller('shopping')
export class ShoppingController {
  constructor(private readonly shoppingService: ShoppingService) {}
  @Post('cart')
  async addToCart(@Body() body: { productId: number; quantity: number }) {
    if (!body.productId || !body.quantity) {
      throw new BadRequestException('productId and quantity are required');
    }
    return this.shoppingService.addToCart(body.productId, body.quantity);
  }

  @Get('cart')
  async getCart() {
    return this.shoppingService.getCart();
  }
}
