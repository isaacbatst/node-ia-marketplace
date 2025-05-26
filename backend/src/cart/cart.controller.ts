import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  userId = 1; // Simulating a logged-in user

  constructor(private readonly cartService: CartService) {}

  @Post()
  addToCart(@Body() body: { productId: number; quantity: number }) {
    if (!body.productId || !body.quantity) {
      throw new BadRequestException('Product ID and quantity are required');
    }
    return this.cartService.addToCart(
      this.userId,
      body.productId,
      body.quantity,
    );
  }

  @Get()
  async getCart() {
    const cart = await this.cartService.getCart(this.userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    return cart;
  }
}
