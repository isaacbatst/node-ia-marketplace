import { PostgresService } from '../shared/postgres.service';
import { Injectable, NotFoundException } from '@nestjs/common';

type Cart = {
  id: number;
  user_id: number;
  created_at: Date;
  store_id: number;
  store: {
    name: string;
  };
  active: boolean;
  items: {
    id: number;
    name: string;
    price: number;
    quantity: number;
  }[];
};

@Injectable()
export class CartService {
  constructor(private readonly postgresService: PostgresService) {}

  async addToCart(userId: number, productId: number, quantity: number) {
    const product = await this.postgresService.client.query<{
      store_id: number;
    }>('SELECT store_id FROM products WHERE id = $1', [productId]);

    if (product.rows.length === 0) {
      throw new NotFoundException('Product not found');
    }

    const existingCart = await this.postgresService.client.query<{
      id: number;
      store_id: number;
    }>(`SELECT id, store_id FROM carts WHERE user_id = $1 AND active = true`, [
      userId,
    ]);

    if (
      existingCart.rows.length > 0 &&
      existingCart.rows[0].store_id === product.rows[0].store_id
    ) {
      await this.postgresService.client.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
        [existingCart.rows[0].id, productId, quantity],
      );

      return {
        id: existingCart.rows[0].id,
      };
    }

    if (
      existingCart.rows.length > 0 &&
      existingCart.rows[0].store_id !== product.rows[0].store_id
    ) {
      await this.postgresService.client.query(
        `UPDATE carts SET active = false WHERE id = $1`,
        [existingCart.rows[0].id],
      );
    }

    const cart = await this.postgresService.client.query<{ id: number }>(
      `INSERT INTO carts (user_id, store_id) VALUES ($1, $2) RETURNING id`,
      [userId, product.rows[0].store_id],
    );

    await this.postgresService.client.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)`,
      [cart.rows[0].id, productId, quantity],
    );

    return {
      id: cart.rows[0].id,
    };
  }

  async getCart(userId: number) {
    const result = await this.postgresService.client.query<Cart>(
      `SELECT 
        carts.id AS id,
        carts.user_id AS user_id,
        carts.created_at AS created_at,
        carts.store_id AS store_id,
        carts.active AS active,
        json_build_object(
          'id', stores.id,
          'name', stores.name
        ) AS store,
        json_agg(
          json_build_object(
            'id', products.id,
            'name', products.name,
            'price', products.price,
            'quantity', cart_items.quantity
          )
        ) as items
      FROM carts 
        LEFT JOIN cart_items ON carts.id = cart_items.cart_id
        LEFT JOIN products ON cart_items.product_id = products.id
        JOIN stores ON carts.store_id = stores.id

      WHERE user_id = $1 AND active = true
      GROUP BY carts.id, stores.id
      `,
      [userId],
    );

    const hasItems =
      result.rows[0].items.length > 0 && result.rows[0].items[0].id !== null;

    return result.rows[0]
      ? {
          ...result.rows[0],
          items: hasItems ? result.rows[0].items : [],
          total:
            result.rows[0].items?.reduce(
              (acc, item) => acc + item.price * item.quantity,
              0,
            ) ?? 0,
        }
      : null;
  }

  async updateCartItemQuantity(
    userId: number,
    productId: number,
    quantity: number,
  ) {
    const cart = await this.getCart(userId);

    if (!cart) {
      throw new NotFoundException('Cart not found 1');
    }

    if (cart.user_id !== userId) {
      throw new NotFoundException('Cart not found 2');
    }

    if (cart.items.every((item) => item.id !== productId)) {
      throw new NotFoundException('Product not found in cart');
    }

    await this.postgresService.client.query(
      `UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3`,
      [quantity, cart.id, productId],
    );
  }

  async removeCartItem(userId: number, productId: number) {
    const cart = await this.getCart(userId);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (cart.user_id !== userId) {
      throw new NotFoundException('Cart not found');
    }

    if (cart.items.every((item) => item.id !== productId)) {
      throw new NotFoundException('Product not found in cart');
    }

    await this.postgresService.client.query(
      `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
      [cart.id, productId],
    );
  }
}
