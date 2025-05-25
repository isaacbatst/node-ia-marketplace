import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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

  @Put('cart/:id/items/:productId')
  async updateCartItem(
    @Body() body: { quantity: number },
    @Param('id') cartId: number,
    @Param('productId') id: number,
  ) {
    if (!body.quantity) {
      throw new BadRequestException('quantity is required');
    }
    await this.shoppingService.updateCartItemQuantity(
      cartId,
      id,
      body.quantity,
    );
  }

  @Delete('cart/:id/items/:productId')
  async removeCartItem(
    @Param('id') cartId: number,
    @Param('productId') id: number,
  ) {
    await this.shoppingService.removeItemFromCart(cartId, id);
  }
}
