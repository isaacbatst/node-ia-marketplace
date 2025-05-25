import { Injectable } from '@nestjs/common';
import { PostgresService } from '../shared/infra/postgres.service';

type Product = {
  id: number;
  name: string;
  price: number;
  embedding: number[];
  store: {
    id: number;
    name: string;
  };
};

@Injectable()
export class CatalogService {
  constructor(private readonly postgresService: PostgresService) {}

  async listProducts(q?: string) {
    let query = `
      SELECT 
        products.id, 
        products.name, 
        products.price, 
        products.embedding,
        json_build_object(
          'id', stores.id,
          'name', stores.name
        ) as store
      FROM products 
      JOIN stores ON products.store_id = stores.id
    `;

    if (q) {
      query += ` WHERE products.name ILIKE '%${q}%'`;
    }

    const result = await this.postgresService.client.query<Product>(query);
    return result.rows as unknown[];
  }

  async getProduct(id: number) {
    const query = `
      SELECT 
        products.id, 
        products.name, 
        products.price, 
        products.embedding,
        json_build_object(
          'id', stores.id,
          'name', stores.name
        ) as store
      FROM products 
      JOIN stores ON products.store_id = stores.id
      WHERE products.id = $1
    `;
    const values = [id];
    const result = await this.postgresService.client.query<Product>(
      query,
      values,
    );
    return result.rows[0];
  }
}
