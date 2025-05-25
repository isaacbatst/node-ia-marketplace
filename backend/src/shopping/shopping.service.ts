import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresService } from '../shared/infra/postgres.service';
import { CatalogService } from '../catalog/catalog.service';

type Cart = {
  id: number;
  store: {
    id: number;
    name: string;
  };
  products: {
    id: number;
    name: string;
    price: number;
    quantity: number;
  }[];
};

@Injectable()
export class ShoppingService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly catalogService: CatalogService,
  ) {}

  async addToCart(productId: number, quantity: number) {
    const userId = 1;
    const product = await this.catalogService.getProduct(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const activeCartQuery = `
      SELECT id, store_id FROM carts 
      WHERE user_id = $1 AND active = true
    `;
    const activeCartValues = [userId];
    const activeCartResult = await this.postgresService.client.query<{
      id: number;
      store_id: number;
    }>(activeCartQuery, activeCartValues);

    if (
      activeCartResult.rows.length > 0 &&
      activeCartResult.rows[0].store_id === product.store.id
    ) {
      const cartId = activeCartResult.rows[0].id;
      const query = `
        INSERT INTO cart_items (cart_id, product_id, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (cart_id, product_id) DO 
        UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      `;
      const values = [cartId, productId, quantity];
      await this.postgresService.client.query(query, values);
      return {
        id: cartId,
      };
    }

    if (
      activeCartResult.rows.length > 0 &&
      activeCartResult.rows[0].store_id !== product.store.id
    ) {
      const query = `
        UPDATE carts SET active = false WHERE id = $1
      `;
      const values = [activeCartResult.rows[0].id];
      await this.postgresService.client.query(query, values);
    }

    const query = `
      INSERT INTO carts (user_id, store_id, active)
      VALUES ($1, $2, true)
      RETURNING id
    `;
    const values = [userId, product.store.id];
    const result = await this.postgresService.client.query<{ id: number }>(
      query,
      values,
    );
    const cartId = result.rows[0].id;
    const query2 = `
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES ($1, $2, $3)
    `;
    const values2 = [cartId, productId, quantity];
    await this.postgresService.client.query(query2, values2);
    return {
      id: cartId,
    };
  }

  async getCart() {
    const userId = 1;
    const query = `
      SELECT 
        carts.id AS id,
        json_build_object(
          'id', stores.id,
          'name', stores.name
        ) as store,
        json_agg(
          json_build_object(
            'id', products.id,
            'name', products.name,
            'price', products.price,
            'quantity', cart_items.quantity
          )
        ) as products
      FROM carts
      JOIN stores ON carts.store_id = stores.id
      JOIN cart_items ON carts.id = cart_items.cart_id
      JOIN products ON cart_items.product_id = products.id
      WHERE carts.user_id = $1 AND carts.active = true
      GROUP BY carts.id, stores.id
    `;
    const values = [userId];
    const result = await this.postgresService.client.query<Cart>(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
}
