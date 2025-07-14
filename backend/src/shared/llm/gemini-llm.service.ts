import { Injectable } from '@nestjs/common';
import { AnswerMessage, LlmService, SuggestCarts } from './llm.service';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import zodToJsonSchema from 'zod-to-json-schema';
import { answerMessageSchema } from './schemas';

@Injectable()
export class GeminiLlmService extends LlmService {
  private readonly chatModel: string = 'gemini-2.5-flash';
  private readonly embeddingModel: string = 'gemini-embedding-exp-03-07';
  private client: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    super();
    this.client = new GoogleGenAI({
      apiKey: this.configService.get<string>('GEMINI_API_KEY'),
    });
  }

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
  async embedInput(input: string): Promise<{ embedding: number[] } | null> {
    try {
      const result = await this.client.models.embedContent({
        model: this.embeddingModel,
        contents: input,
        config: {
          taskType: 'SEMANTIC_SIMILARITY',
          outputDimensionality: 1536
        },
      })
      const embeddings = result.embeddings ? result.embeddings[0].values : null;
      if(!embeddings || embeddings.length === 0) {
        console.error('No embeddings returned for input:', input);
        return null;
      }
      return { embedding: embeddings };
    } catch (error) {
      console.error('Error embedding input:', error);
      return null;
    }
  }
  async answerMessage(
    message: string,
    previousMessageId: string | null,
    previousMessages: { content: string; role: string }[],
  ): Promise<(AnswerMessage & { responseId: string }) | null> {
    const response = await this.client.models.generateContent({
      model: this.chatModel,
      contents: previousMessages
        .map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          text: msg.content,
        }))
        .concat({
          role: 'user',
          text: message,
        }),
      config: {
        systemInstruction: GeminiLlmService.ANSWER_MESSAGE_PROMPT,
        responseJsonSchema: zodToJsonSchema(answerMessageSchema),
      },
    });

    const { text } = response; // ```json{}```
    const jsonMatch = text?.match(/```json\n([\s\S]*?)\n```/) ||
      text?.match(/```\n([\s\S]*?)\n```/) || [null, text];

    const jsonContent = jsonMatch[1] ?? text ?? '{}';

    try {
      const parsedResponse = JSON.parse(jsonContent);
      const validated = answerMessageSchema.safeParse(parsedResponse);
      if (!validated.success) {
        console.error('Invalid response format:', validated.error);
        return null;
      }

      return {
        ...validated.data,
        responseId: response.responseId ?? `gemini-${Date.now()}`,
      };
    } catch (error) {
      console.error('Error parsing response JSON:', error);
      return null;
    }
  }

  static readonly ANSWER_MESSAGE_PROMPT = `Você é um assistente de um marketplace com conhecimentos gastronômicos. Identifique qual ação o usuário está solicitando:
        - 'send_message': Use essa ação para responder o usuário antes de commitar alguma ação. Caso o usuário tenha solicitado uma ação, mas você ainda precise de mais informações, use essa ação para perguntar ao usuário. Informe em "message" a resposta do assistente.
        - 'suggest_carts': Use essa ação apenas quando já tiver todas as informações necessárias para sugerir um carrinho de compras. Informe em "input" uma descrição do que o usuário está solicitando, junto a uma lista de produtos que você sugeriria para o carrinho. A mensagem que acompanha essa ação deve ser uma confirmação para o usuário, perguntando se ele confirma a ação de montar o carrinho de compras.
        
        Exemplo: 
          - Mensagem do usuário: "Montar carrinho para receita de bolo de chocolate"
          - Resposta do assistente: "Você solicitou um bolo de chocolate. Confirma a ação para que possa montar o carrinho de compras?"
          - Input: "Bolo de chocolate. Ingredientes: farinha, açúcar, ovos, chocolate meio amargo, fermento em pó."
        
        Não use a ação 'suggest_carts' para responder ao usuário, apenas para sugerir um carrinho de compras. Use a ação 'send_message' para responder ao usuário.
        Não precisa ir muito afundo em detalhes, se o usuário solicitar um bolo de chocolate, você pode sugerir um carrinho com ingredientes básicos, ao invés de perguntar se ele prefere chocolate meio amargo ou ao leite ou pedir detalhes sobre a receita, pois o usuário pode inserir esses detalhes depois.`;
}
