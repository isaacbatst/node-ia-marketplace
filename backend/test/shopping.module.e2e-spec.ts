/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PostgresService } from '../src/shared/infra/postgres.service';

describe('ShoppingModule', () => {
  let app: INestApplication;
  let server: Server;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.enableShutdownHooks();
    await app.init();
    server = app.getHttpServer() as Server;
    const postgresService = app.get<PostgresService>(PostgresService);
    await postgresService.client.query(
      'TRUNCATE TABLE carts, cart_items RESTART IDENTITY',
    );
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create a cart and add a product to it', async () => {
    const response = await request(server).post('/shopping/cart').send({
      productId: 1,
      quantity: 2,
    });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();

    const cartResponse = await request(server).get('/shopping/cart');
    expect(cartResponse.status).toBe(200);
    expect(cartResponse.body.items).toHaveLength(1);
    expect(cartResponse.body.items[0].id).toBe(1);
    expect(cartResponse.body.items[0].quantity).toBe(2);
  });

  it('should add a product to an existing cart if the store is the same', async () => {
    const response = await request(server).post('/shopping/cart').send({
      productId: 1,
      quantity: 2,
    });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();

    const response2 = await request(server).post('/shopping/cart').send({
      productId: 2,
      quantity: 3,
    });

    expect(response2.status).toBe(201);
    expect(response2.body.id).toBe(response.body.id);

    const cartResponse = await request(server).get('/shopping/cart');
    expect(cartResponse.status).toBe(200);
    expect(cartResponse.body.items).toHaveLength(2);
    expect(cartResponse.body.items).toContainEqual(
      expect.objectContaining({
        id: 1,
        quantity: 2,
      }),
    );
    expect(cartResponse.body.items).toContainEqual(
      expect.objectContaining({
        id: 2,
        quantity: 3,
      }),
    );
  });

  it('should add a product to a new cart if the store is different', async () => {
    const response = await request(server).post('/shopping/cart').send({
      productId: 1,
      quantity: 2,
    });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();

    const response2 = await request(server).post('/shopping/cart').send({
      productId: 16,
      quantity: 3,
    });

    expect(response2.status).toBe(201);
    expect(response2.body.id).not.toBe(response.body.id);

    const cartResponse = await request(server).get('/shopping/cart');
    expect(cartResponse.status).toBe(200);
    expect(cartResponse.body.id).toBe(response2.body.id);
    expect(cartResponse.body.items).toHaveLength(1);
    expect(cartResponse.body.items[0].id).toBe(16);
    expect(cartResponse.body.items[0].quantity).toBe(3);
  });

  it('should update the quantity of a product in the cart', async () => {
    const response = await request(server).post('/shopping/cart').send({
      productId: 1,
      quantity: 2,
    });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();

    const response2 = await request(server)
      .put(`/shopping/cart/${response.body.id}/items/1`)
      .send({
        quantity: 3,
      });

    expect(response2.status).toBe(200);

    const cartResponse = await request(server).get('/shopping/cart');
    expect(cartResponse.status).toBe(200);
    expect(cartResponse.body.items).toHaveLength(1);
    expect(cartResponse.body.items[0].id).toBe(1);
    expect(cartResponse.body.items[0].quantity).toBe(3);
  });

  it('should remove a product from the cart', async () => {
    const response = await request(server).post('/shopping/cart').send({
      productId: 1,
      quantity: 2,
    });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();

    const response3 = await request(server)
      .delete(`/shopping/cart/${response.body.id}/items/1`)
      .send();

    expect(response3.status).toBe(200);

    const cartResponse = await request(server).get('/shopping/cart');
    expect(cartResponse.status).toBe(200);

    expect(cartResponse.body.items).toHaveLength(0);
  });
});
