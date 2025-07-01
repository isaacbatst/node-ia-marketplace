/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PostgresService } from '../src/shared/postgres.service';

describe('Chat (e2e)', () => {
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
      'TRUNCATE TABLE chat_sessions RESTART IDENTITY CASCADE',
    );
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create a new chat session', async () => {
    const postResponse = await request(app.getHttpServer()).post('/chat');
    expect(postResponse.status).toBe(201);
    expect(postResponse.body).toHaveProperty('id');
    const getResponse = await request(app.getHttpServer()).get(
      '/chat/' + postResponse.body.id,
    );
    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveProperty('id', postResponse.body.id);
    expect(getResponse.body).toHaveProperty('created_at');
  });
});
