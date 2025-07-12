import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { answerMessageSchema, suggestCartsSchema } from './schemas';

type AnswerMessage = z.infer<typeof answerMessageSchema>;
type SuggestCarts = z.infer<typeof suggestCartsSchema>;

@Injectable()
export abstract class LlmService {
  abstract suggestCarts(
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
  ) : Promise<(SuggestCarts & { responseId: string }) | null>

  abstract batchEmbedProducts(products: { id: number; name: string }[]): Promise<void>
  abstract handleWebhookEvent(rawBody: string, headers: Record<string, string>): Promise<{
    productId: string;
    embedding: number[];
  }[] | null>
  abstract embedInput(input: string): Promise<{ embedding: number[] } | null>
  abstract answerMessage(
    message: string,
    previousMessageId: string | null,
  ): Promise<(AnswerMessage & { responseId: string }) | null>
}
