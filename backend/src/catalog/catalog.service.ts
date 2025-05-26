import { Injectable } from '@nestjs/common';
import { PostgresService } from '../shared/postgres.service';

type Product = {
  id: number;
  name: string;
  price: number;
  store_id: number;
  embedding: number[] | null;
};

@Injectable()
export class CatalogService {
  constructor(private readonly postgresService: PostgresService) {}

  async getCatalog(search = '') {
    let query = `SELECT products.id, products.name, products.price, products.embedding, json_build_object('id', stores.id, 'name', stores.name) as store FROM products
        JOIN stores ON products.store_id = stores.id`;

    if (search) {
      query += ` WHERE products.name ILIKE $1`;
    }

    const result = await this.postgresService.client.query<Product>(
      query,
      search ? [`%${search}%`] : undefined,
    );

    return result.rows;
  }
}
