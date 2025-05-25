/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Server } from 'node:http';

describe('CatalogController', () => {
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
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return products', async () => {
    const response = await request(server).get('/catalog');

    expect(response.status).toBe(200);
    const products = response.body as any[];
    expect(products.length).toEqual(36);
    expect(products[0].id).toEqual(1);
    expect(products[0].store.id).toEqual(1);
  });

  it('should return products with search term', async () => {
    const response = await request(server).get(
      `/catalog?q=${encodeURIComponent('feijão')}`,
    );

    expect(response.status).toBe(200);
    const products = response.body as any[];
    expect(products.length).toEqual(2);
    expect(products[0].id).toEqual(1);
    expect(products[0].store.id).toEqual(1);
  });
});
