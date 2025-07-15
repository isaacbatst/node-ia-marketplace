import { LlmService } from '@/shared/llm/llm.service';
import { PostgresService } from '@/shared/postgres.service';
import {
  BadGatewayException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

type ChatSession = {
  id: number;
  created_at: Date;
  user_id: number;
};

type ChatMessage = {
  id: number;
  content: string;
  sender: 'user' | 'assistant';
  openai_message_id: string | null;
  created_at: Date;
  message_type: 'text' | 'suggest_carts_result';
};

type ChatMessageAction = {
  id: number;
  chat_message_id: number;
  action_type: string;
  payload: { input: string };
  created_at: Date;
  confirmed_at: Date | null;
  executed_at: Date | null;
};

@Injectable()
export class ChatService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly llmService: LlmService,
  ) {}

  async createChatSession(userId: number) {
    const result = await this.postgresService.client.query<{
      id: number;
    }>('INSERT INTO chat_sessions (user_id) VALUES ($1) RETURNING id', [
      userId,
    ]);
    return result.rows[0];
  }

  async getChatSessions(userId: number) {
    const result = await this.postgresService.client.query<ChatSession>(
      `SELECT 
        cs.id, 
        cs.user_id,
        cs.created_at,
        COALESCE(
          json_agg(
            jsonb_build_object(
              'id', cm.id,
              'chat_session_id', cm.chat_session_id,
              'content', cm.content,
              'sender', cm.sender,
              'openai_message_id', cm.openai_message_id,
              'created_at', cm.created_at,
              'message_type', cm.message_type
            )
          ) FILTER (WHERE cm.id IS NOT NULL), 
          '[]'
        ) AS messages
        FROM chat_sessions as cs
        LEFT JOIN chat_messages as cm ON cs.id = cm.chat_session_id
        WHERE user_id = $1 
        GROUP BY cs.id
        ORDER BY cs.created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async getChatSession(sessionId: number) {
    const result = await this.postgresService.client.query<{
      id: number;
      created_at: Date;
      user_id: number;
      messages: ChatMessage[] | null;
    }>(
      `
      SELECT chat_sessions.id, chat_sessions.created_at, chat_sessions.user_id, JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', chat_messages.id,
          'content', chat_messages.content,
          'sender', chat_messages.sender,
          'openai_message_id', chat_messages.openai_message_id,
          'created_at', chat_messages.created_at,
          'message_type', chat_messages.message_type,
          'action', CASE 
            WHEN chat_messages_actions.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'action_type', chat_messages_actions.action_type,
                'payload', chat_messages_actions.payload,
                'id', chat_messages_actions.id,
                'created_at', chat_messages_actions.created_at,
                'confirmed_at', chat_messages_actions.confirmed_at,
                'executed_at', chat_messages_actions.executed_at
              )
            ELSE NULL
          END

        )
      ) FILTER(WHERE chat_messages.id IS NOT NULL) AS messages 
      FROM chat_sessions
      LEFT JOIN chat_messages ON chat_sessions.id = chat_messages.chat_session_id
      LEFT JOIN chat_messages_actions ON chat_messages.id = chat_messages_actions.chat_message_id
      WHERE chat_sessions.id = $1
      GROUP BY chat_sessions.id, chat_messages.chat_session_id
    `,
      [sessionId],
    );
    if (result.rows.length === 0) {
      return null;
    }

    const populatedMessages = await this.populateMessages(
      result.rows[0].messages ?? [],
    );

    return {
      ...result.rows[0],
      messages:
        populatedMessages.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ) ?? [],
    };
  }

  private populateMessages(messages: ChatMessage[]) {
    return Promise.all(
      messages.map(async (message) => {
        if (message.message_type !== 'suggest_carts_result') {
          return message;
        }

        const cartsResult = await this.postgresService.client.query<{
          id: number;
          store_id: number;
          store_name: string;
          score: number;
          products: {
            id: number;
            name: string;
            price: number;
            quantity: number;
          }[];
        }>(
          `
          SELECT c.id, c.store_id, s.name AS store_name, c.score, jSON_AGG(
            JSON_BUILD_OBJECT(
              'id', p.id,
              'name', p.name,
              'price', p.price,
              'quantity', ci.quantity
            )
          ) AS products
          FROM carts c
          JOIN stores s ON c.store_id = s.id
          JOIN cart_items ci ON c.id = ci.cart_id
          JOIN products p ON ci.product_id = p.id
          WHERE c.suggested_by_message_id = $1
          GROUP BY c.store_id, s.name, c.score, c.id
        `,
          [message.id],
        );

        return {
          ...message,
          carts: cartsResult.rows.map((row) => ({
            id: row.id,
            store_id: row.store_id,
            store_name: row.store_name,
            score: row.score,
            total: row.products.reduce(
              (sum, product) => sum + product.price * product.quantity,
              0,
            ),
          })),
        };
      }),
    );
  }

  async addUserMessage(sessionId: number, content: string) {
    const chatMessages = await this.postgresService.client.query<{
      openai_message_id: string | null;
      content: string;
      sender: 'user' | 'assistant';
    }>(
      `SELECT openai_message_id, content, sender FROM chat_messages WHERE chat_session_id = $1 AND sender = 'assistant' ORDER BY created_at DESC`,
      [sessionId],
    );

    const userMessage = await this.addMessageToSession(
      sessionId,
      content,
      'user',
    );

    const llmReponse = await this.llmService.answerMessage(
      content,
      chatMessages.rows[0]?.openai_message_id || null,
      chatMessages.rows.map((msg) => ({
        content: msg.content,
        role: msg.sender,
      })),
    );

    if (!llmReponse) {
      throw new BadGatewayException('Failed to get a response from the LLM');
    }

    const llmMessage = await this.addMessageToSession(
      sessionId,
      llmReponse.message,
      'assistant',
      llmReponse.responseId,
      'text',
    );

    if (llmReponse.action.type === 'suggest_carts') {
      await this.postgresService.client.query(
        `
        INSERT INTO chat_messages_actions (chat_message_id, action_type, payload)
        VALUES ($1, $2, $3)
        ON CONFLICT (chat_message_id, action_type) DO NOTHING
      `,
        [
          llmMessage.id,
          llmReponse.action.type,
          JSON.stringify(llmReponse.action.payload),
        ],
      );
    }

    return userMessage;
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

  async confirmAction(sessionId: number, actionId: number) {
    const session = await this.postgresService.client.query<ChatSession>(
      `SELECT * FROM chat_sessions WHERE id = $1`,
      [sessionId],
    );

    if (session.rows.length === 0) {
      throw new NotFoundException('Chat session not found');
    }

    const result = await this.postgresService.client.query<ChatMessageAction>(
      `SELECT * FROM chat_messages_actions WHERE id = $1`,
      [actionId],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException('Chat message action not found');
    }

    if (result.rows[0].confirmed_at) {
      throw new ConflictException('This action has already been confirmed.');
    }

    await this.postgresService.client.query(
      `UPDATE chat_messages_actions SET confirmed_at = NOW() WHERE id = $1`,
      [actionId],
    );

    if (result.rows[0].action_type === 'suggest_carts') {
      const embeddings = await this.llmService.embedInput(
        result.rows[0].payload.input,
      );
      if (!embeddings) {
        throw new BadGatewayException('Failed to get embeddings from the LLM');
      }

      const relevantProductsGroupedByStore =
        await this.postgresService.client.query<{
          store_id: number;
          products: {
            id: number;
            name: string;
            price: number;
            similarity: number;
          }[];
        }>(
          `
        SELECT store_id, JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'name', name,
            'price', price,
            'similarity', p.embedding <=> $1
          )
        ) AS products
        FROM products p
        WHERE p.embedding <=> $1 < 0.65
        GROUP BY store_id
      `,
          [JSON.stringify(embeddings.embedding)],
        );

      if (relevantProductsGroupedByStore.rows.length === 0) {
        throw new NotFoundException(
          'No relevant products found for the given input.',
        );
      }

      const llmResponse = await this.llmService.suggestCarts(
        relevantProductsGroupedByStore.rows,
        result.rows[0].payload.input,
      );

      if (!llmResponse || !llmResponse.carts) {
        throw new BadGatewayException(
          'Failed to get cart suggestions from the LLM',
        );
      }

      await this.postgresService.client.query(
        `UPDATE chat_messages_actions SET executed_at = NOW() WHERE id = $1`,
        [actionId],
      );

      const message = await this.addMessageToSession(
        sessionId,
        llmResponse.response,
        'assistant',
        llmResponse.responseId,
        'suggest_carts_result',
      );

      await this.saveSuggestedCarts(message.id, llmResponse.carts);
    } else {
      throw new InternalServerErrorException(
        `Action type ${result.rows[0].action_type} is not supported.`,
      );
    }
  }

  private async saveSuggestedCarts(
    messageId: number,
    carts: {
      store_id: number;
      score: number;
      products: {
        id: number;
      }[];
    }[],
  ) {
    for (const cart of carts) {
      const cartResult = await this.postgresService.client.query<{
        id: number;
      }>(
        `INSERT INTO carts (user_id, store_id, score, suggested_by_message_id, active)
         VALUES ($1, $2, $3, $4, FALSE)
         RETURNING id`,
        [1, cart.store_id, cart.score, messageId],
      );

      const cartId = cartResult.rows[0].id;

      for (const product of cart.products) {
        await this.postgresService.client.query(
          `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, 1)
           ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
          [cartId, product.id],
        );
      }
    }
  }

  async chooseCart(cartId: number, userId: number) {
    const cart = await this.postgresService.client.query<{
      id: number;
    }>(`SELECT id FROM carts WHERE id = $1`, [cartId]);

    if (cart.rows.length === 0) {
      throw new NotFoundException('Cart not found');
    }

    await this.postgresService.client.query(
      `UPDATE carts SET active = FALSE WHERE user_id = $1 AND active = TRUE`,
      [userId],
    );

    await this.postgresService.client.query(
      `UPDATE carts SET active = TRUE WHERE id = $1`,
      [cartId],
    );
  }
}
