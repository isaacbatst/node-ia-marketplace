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

  it('should add new messages to the chat session', async () => {
    const postResponse = await request(app.getHttpServer()).post('/chat');
    expect(postResponse.status).toBe(201);
    expect(postResponse.body).toHaveProperty('id');

    const sessionId = postResponse.body.id as number;

    const messageResponse = await request(app.getHttpServer())
      .post(`/chat/${sessionId}/messages`)
      .send({ content: 'Hello, world!' });

    expect(messageResponse.status).toBe(201);
    expect(messageResponse.body).toHaveProperty('id');
    expect(messageResponse.body).toHaveProperty('content', 'Hello, world!');

    const getResponse = await request(app.getHttpServer()).get(
      `/chat/${sessionId}`,
    );
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.messages).toBeDefined();
    expect(getResponse.body.messages[0]).toHaveProperty('sender', 'user');
    expect(getResponse.body.messages[0]).toHaveProperty(
      'content',
      'Hello, world!',
    );
    expect(getResponse.body.messages[1]).toHaveProperty('sender', 'assistant');
  });

  it('should add new messages to the chat session with action', async () => {
    const postResponse = await request(app.getHttpServer()).post('/chat');
    expect(postResponse.status).toBe(201);
    expect(postResponse.body).toHaveProperty('id');

    const sessionId = postResponse.body.id as number;

    const messageResponse = await request(app.getHttpServer())
      .post(`/chat/${sessionId}/messages`)
      .send({ content: 'Quero preparar um bolo de chocolate' });

    expect(messageResponse.status).toBe(201);
    expect(messageResponse.body).toHaveProperty('id');
    expect(messageResponse.body).toHaveProperty(
      'content',
      'Quero preparar um bolo de chocolate',
    );

    const getResponse = await request(app.getHttpServer()).get(
      `/chat/${sessionId}`,
    );
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.messages).toBeDefined();
    expect(getResponse.body.messages[0]).toHaveProperty('sender', 'user');
    expect(getResponse.body.messages[0]).toHaveProperty(
      'content',
      'Quero preparar um bolo de chocolate',
    );
    expect(getResponse.body.messages[1]).toHaveProperty('sender', 'assistant');
    expect(getResponse.body.messages[1]).toHaveProperty('action');

    const postConfirmResponse = await request(app.getHttpServer()).post(
      `/chat/${sessionId}/actions/${getResponse.body.messages[1].action.id}/confirm`,
    );
    console.log(postConfirmResponse.body);
    expect(postConfirmResponse.status).toBe(201);

    const getAfterConfirmResponse = await request(app.getHttpServer()).get(
      `/chat/${sessionId}`,
    );
    expect(getAfterConfirmResponse.status).toBe(200);
    expect(getAfterConfirmResponse.body.messages).toHaveLength(3);
    expect(getAfterConfirmResponse.body.messages[2]).toHaveProperty(
      'sender',
      'assistant',
    );
    console.log(getAfterConfirmResponse.body.messages[2]);
  }, 30000);
});
