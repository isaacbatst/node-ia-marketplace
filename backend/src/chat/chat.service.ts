import { PostgresService } from '@/shared/postgres.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  constructor(private readonly postgresService: PostgresService) {}

  async createChatSession(userId: number) {
    const result = await this.postgresService.client.query<{
      id: number;
    }>('INSERT INTO chat_sessions (user_id) VALUES ($1) RETURNING id', [
      userId,
    ]);
    return result.rows[0];
  }

  async getChatSession(sessionId: number) {
    const result = await this.postgresService.client.query<{
      id: number;
      created_at: Date;
      user_id: number;
    }>('SELECT * FROM chat_sessions WHERE id = $1', [sessionId]);
    return result.rows[0];
  }
}
