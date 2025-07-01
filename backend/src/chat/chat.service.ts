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

  async addUserMessage(sessionId: number, content: string) {
    return this.addMessageToSession(sessionId, content, 'user');
  }

  private async addMessageToSession(
    sessionId: number,
    content: string,
    sender: 'user' | 'assistant',
    openaiMessageId?: string,
    messageType: 'text' | 'suggest_carts_result' = 'text',
  ) {
    const result = await this.postgresService.client.query<{
      id: number;
      content: string;
      sender: string;
      openai_message_id: string | null;
      created_at: Date;
      message_type: string;
    }>(
      `INSERT INTO chat_messages (chat_session_id, content, sender, openai_message_id, message_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sessionId, content, sender, openaiMessageId || null, messageType],
    );
    return result.rows[0];
  }
}
