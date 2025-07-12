import { Injectable } from '@nestjs/common';
import { AnswerMessage, LlmService, SuggestCarts } from './llm.service';

@Injectable()
export class GeminiLlmService extends LlmService {
  suggestCarts(
    relevantProductsByStore: {
      store_id: number;
      products: {
        id: number;
        name: string;
        price: number;
        similarity: number;
      }[];
    }[],
    input: string,
  ): Promise<(SuggestCarts & { responseId: string }) | null> {
    throw new Error('Method not implemented.');
  }
  batchEmbedProducts(products: { id: number; name: string }[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  handleWebhookEvent(
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<{ productId: string; embedding: number[] }[] | null> {
    throw new Error('Method not implemented.');
  }
  embedInput(input: string): Promise<{ embedding: number[] } | null> {
    throw new Error('Method not implemented.');
  }
  answerMessage(
    message: string,
    previousMessageId: string | null,
  ): Promise<(AnswerMessage & { responseId: string }) | null> {
    throw new Error('Method not implemented.');
  }
}
