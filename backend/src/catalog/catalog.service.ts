import { Injectable } from '@nestjs/common';
import { PostgresService } from '../shared/infra/postgres.service';

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

    const result = await this.postgresService.client.query(query);
    return result.rows as unknown[];
  }
}
