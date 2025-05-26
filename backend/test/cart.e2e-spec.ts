/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PostgresService } from '../src/shared/postgres.service';

describe('Cart (e2e)', () => {
  let app: INestApplication<App>;
  let postgresService: PostgresService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableShutdownHooks();
    await app.init();

    postgresService = moduleFixture.get<PostgresService>(PostgresService);
    await postgresService.client.query(
      'TRUNCATE TABLE carts, cart_items RESTART IDENTITY CASCADE',
    );
  });

  afterEach(async () => {
    await app.close();
  });

  it('should add a product to the cart', async () => {
    const response = await request(app.getHttpServer()).post('/cart').send({
      productId: 1,
      quantity: 2,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');

    const responseCart = await request(app.getHttpServer()).get('/cart/');
    expect(responseCart.status).toBe(200);
    expect(responseCart.body.id).toBe(response.body.id);
    expect(responseCart.body.items[0].id).toBe(1);
    expect(responseCart.body.items[0].quantity).toBe(2);
  });

  it('should add a product to an existing cart if the store is the same', async () => {
    const response = await request(app.getHttpServer()).post('/cart').send({
      productId: 1,
      quantity: 2,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');

    const response2 = await request(app.getHttpServer()).post('/cart').send({
      productId: 2,
      quantity: 3,
    });
    expect(response2.status).toBe(201);

    const response3 = await request(app.getHttpServer()).post('/cart').send({
      productId: 2,
      quantity: 1,
    });
    expect(response2.status).toBe(201);

    const responseCart = await request(app.getHttpServer()).get('/cart/');
    expect(responseCart.status).toBe(200);
    expect(responseCart.body.id).toBe(response.body.id);
    expect(responseCart.body.id).toBe(response2.body.id);
    expect(responseCart.body.id).toBe(response3.body.id);
    expect(responseCart.body.items.length).toBe(2);
    expect(responseCart.body.items[0].id).toBe(1);
    expect(responseCart.body.items[0].quantity).toBe(2);
    expect(responseCart.body.items[1].id).toBe(2);
    expect(responseCart.body.items[1].quantity).toBe(4);
  });

  it('should create a new cart if the store is different', async () => {
    const response = await request(app.getHttpServer()).post('/cart').send({
      productId: 1,
      quantity: 2,
    });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    const response2 = await request(app.getHttpServer()).post('/cart').send({
      productId: 17,
      quantity: 3,
    });
    expect(response2.status).toBe(201);
    expect(response2.body).toHaveProperty('id');
    expect(response2.body.id).not.toBe(response.body.id);

    const responseCart = await request(app.getHttpServer()).get('/cart/');
    expect(responseCart.status).toBe(200);
    expect(responseCart.body.id).toBe(response2.body.id);
  });

  it('should update the quantity of an existing product in the cart', async () => {
    const response = await request(app.getHttpServer()).post('/cart').send({
      productId: 1,
      quantity: 2,
    });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    const response2 = await request(app.getHttpServer())
      .put(`/cart/${response.body.id}/items/1`)
      .send({
        quantity: 5,
      });
    expect(response2.status).toBe(200);

    const responseCart = await request(app.getHttpServer()).get('/cart/');
    expect(responseCart.status).toBe(200);
    expect(responseCart.body.id).toBe(response.body.id);
    expect(responseCart.body.items.length).toBe(1);
    expect(responseCart.body.items[0].id).toBe(1);
    expect(responseCart.body.items[0].quantity).toBe(5);
  });

  it('should remove a product from the cart if quantity is 0', async () => {
    const response = await request(app.getHttpServer()).post('/cart').send({
      productId: 1,
      quantity: 2,
    });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    const response2 = await request(app.getHttpServer()).delete(
      `/cart/${response.body.id}/items/1`,
    );
    expect(response2.status).toBe(200);

    const responseCart = await request(app.getHttpServer()).get('/cart/');
    expect(responseCart.status).toBe(200);
    expect(responseCart.body.id).toBe(response.body.id);
    expect(responseCart.body.items.length).toBe(0);
  });
});
