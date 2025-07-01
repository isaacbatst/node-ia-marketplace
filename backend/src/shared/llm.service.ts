import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';
import { CreateEmbeddingResponse } from 'openai/resources/embeddings';

const answerMessageSchema = z.object({
  message: z.string(),
  action: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('send_message'),
    }),
    z.object({
      type: z.literal('suggest_carts'),
      payload: z.object({
        input: z.string(),
      }),
    }),
  ]),
});

const suggestCartsSchema = z.object({
  carts: z.array(
    z.object({
      store_id: z.number(),
      score: z.number(),
      products: z.array(
        z.object({
          id: z.number(),
          quantity: z.number(),
          name: z.string(),
        }),
      ),
    }),
  ),
  response: z.string(),
});

type AnswerMessage = z.infer<typeof answerMessageSchema>;

@Injectable()
export class LlmService {
  static readonly ANSWER_MESSAGE_PROMPT = `Você é um assistente de um marketplace com conhecimentos gastronômicos. Identifique qual ação o usuário está solicitando:
        - 'send_message': Use essa ação para responder o usuário antes de commitar alguma ação. Caso o usuário tenha solicitado uma ação, mas você ainda precise de mais informações, use essa ação para perguntar ao usuário. Informe em "message" a resposta do assistente.
        - 'suggest_carts': Use essa ação apenas quando já tiver todas as informações necessárias para sugerir um carrinho de compras. Informe em "input" uma descrição do que o usuário está solicitando, junto a uma lista de produtos que você sugeriria para o carrinho. A mensagem que acompanha essa ação deve ser uma confirmação para o usuário, perguntando se ele confirma a ação de montar o carrinho de compras.
        
        Exemplo: 
          - Mensagem do usuário: "Montar carrinho para receita de bolo de chocolate"
          - Resposta do assistente: "Você solicitou um bolo de chocolate. Confirma a ação para que possa montar o carrinho de compras?"
          - Input: "Bolo de chocolate. Ingredientes: farinha, açúcar, ovos, chocolate meio amargo, fermento em pó."
        
        Não use a ação 'suggest_carts' para responder ao usuário, apenas para sugerir um carrinho de compras. Use a ação 'send_message' para responder ao usuário.
        Não precisa ir muito afundo em detalhes, se o usuário solicitar um bolo de chocolate, você pode sugerir um carrinho com ingredientes básicos, ao invés de perguntar se ele prefere chocolate meio amargo ou ao leite ou pedir detalhes sobre a receita, pois o usuário pode inserir esses detalhes depois.`;

  static readonly SUGGEST_CARTS_PROMPT = `
  Você é um assistente de um marketplace com conhecimentos gastronômicos. Crie carrinhos de compras por loja com base nos produtos sugeridos.

        Atente-se às quantidades necessárias de cada produto e à quantidade disponível em cada loja. Por exemplo, se a receita pede 1kg de farinha, mas a loja só tem pacotes de 500g, você deve sugerir dois pacotes de 500g.

        Tolere variações nas marcas e apresentações dos produtos, mas mantenha o foco nos ingredientes necessários para a receita.

        Calcule um score para cada carrinho sugerido, baseado na quantidade de produtos disponíveis e na correspondência com os produtos necessários para a melhor execução da receita. Score de 0 a 100.

        Exemplos do que pode diminuir o score, mas não limitado a:
        - Produtos que não estão disponíveis na loja.
        - Produtos que não correspondem exatamente aos necessários para a receita, mas são substitutos aceitáveis.

        ATENÇÃO: O campo "id" de cada produto nos carrinhos ("carts") deve ser exatamente o id do produto disponível informado na lista de produtos disponíveis de cada loja. Não invente ids, utilize apenas os ids fornecidos.


        Exemplo:
          - Input: "Bolo de chocolate. Ingredientes: farinha, açúcar, ovos, chocolate meio amargo, fermento em pó. 
          
          Produtos disponíveis na loja 1: farinha de trigo (id: 1), açúcar refinado (id: 2), ovos (id: 3), chocolate meio amargo (id: 4), fermento em pó (id: 5). 

          Produtos disponíveis na loja 2: farinha de trigo (id: 6), açúcar cristal (id: 7), ovos caipira (id: 8), chocolate ao leite (id: 9). 
          
          Produtos disponíveis na loja 3: farinha de trigo (id: 10).",
          - Resposta:
          {
        "carts": [
          {
            "store_id": 1,
            "products": [
          { "id": 1, "name": "farinha de trigo 1kg", "quantity": 1 },
          { "id": 2, "name": "açúcar refinado 1kg", "quantity": 1 },
          { "id": 3, "name": "ovos 12 unidades", "quantity": 1 },
          { "id": 4, "name": "chocolate meio amargo 500g", "quantity": 1 },
          { "id": 5, "name": "fermento em pó 100g", "quantity": 1 }
            ],
            "score": 100,
          },
          {
            "store_id": 2,
            "products": [
          { "id": 6, "name": "farinha de trigo 1kg", "quantity": 1 },
          { "id": 7, "name": "açúcar cristal 1kg", "quantity": 1 },
          { "id": 8, "name": "ovos caipira unidade", "quantity": 6 },
          { "id": 9, "name": "chocolate ao leite 500g", "quantity": 1 }
            ],
            "score": 70,
          },
          {
            "store_id": 3,
            "products": [
          { "id": 10, "name": "farinha de trigo 1kg", "quantity": 1 }
            ],
            "score": 20,
          }
        ],
        response: 'Carrinhos sugeridos com base nos produtos disponíveis.'
          }

        Os produtos disponíveis de cada loja são informados com seus respectivos ids. Sempre utilize o id correto do produto disponível ao montar os carrinhos.`;

  private client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('OPEN_AI_API_KEY'),
      webhookSecret: this.configService.get<string>('OPEN_AI_WEBHOOK_SECRET'),
    });
  }

  async suggestCarts(
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
  ) {
    try {
      const response = await this.client.responses.parse({
        model: 'gpt-4.1-nano',
        instructions: LlmService.SUGGEST_CARTS_PROMPT,
        input: `Input do usuário: ${input}\n\nProdutos disponíveis por loja:\n${JSON.stringify(
          relevantProductsByStore,
          null,
          2,
        )}`,
        text: {
          format: zodTextFormat(suggestCartsSchema, 'suggestCartsSchema'),
        },
      });

      if (!response.output_parsed) {
        console.error('No parsed output in response:', response);
        return null;
      }

      return {
        ...response.output_parsed,
        responseId: response.id,
      };
    } catch (error) {
      console.error('Error in LlmService.suggestCarts:', error);
      return null;
    }
  }

  async batchEmbedProducts(products: { id: number; name: string }[]) {
    const jsonlFile = products
      .map((product) =>
        JSON.stringify({
          custom_id: product.id.toString(),
          method: 'POST',
          url: '/v1/embeddings',
          body: {
            model: 'text-embedding-3-small',
            input: product.name,
          },
        }),
      )
      .join('\n');

    const uploadedFile = await this.client.files.create({
      file: new File([jsonlFile], 'products.jsonl', {
        type: 'application/jsonl',
      }),
      purpose: 'batch',
    });

    if (!uploadedFile.id) {
      console.error('Failed to upload file for batch embedding');
      return null;
    }

    await this.client.batches.create({
      input_file_id: uploadedFile.id,
      completion_window: '24h',
      endpoint: '/v1/embeddings',
    });
  }

  async handleWebhookEvent(rawBody: string, headers: Record<string, string>) {
    console.log('LlmService.handleWebhookEvent called');
    const event = await this.client.webhooks.unwrap(rawBody, headers);

    if (event.type !== 'batch.completed') {
      console.warn('Received non-batch event:', event.type);
      return;
    }

    console.log('Batch completed event received:', event.data.id);
    const batch = await this.client.batches.retrieve(event.data.id);
    if (!batch || !batch.output_file_id) {
      console.error('Batch output file not found:', event.data.id);
      return;
    }

    console.log('Batch output file ID:', batch.output_file_id);
    const outputFile = await this.client.files.content(batch.output_file_id);
    const results = (await outputFile.text())
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        const data = JSON.parse(line) as {
          custom_id: string;
          response: {
            body: CreateEmbeddingResponse;
          };
        };

        if (
          !data.response ||
          !data.response.body ||
          !data.response.body.data ||
          data.response.body.data.length === 0
        ) {
          console.warn('Invalid response data:', data);
          return null;
        }

        return {
          productId: data.custom_id,
          embedding: data.response.body.data[0].embedding,
        };
      })
      .filter((result) => result !== null);

    return results;
  }

  async embedInput(input: string): Promise<{ embedding: number[] } | null> {
    try {
      console.log('LlmService.embedInput called with input:', input);
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: input,
      });
      console.log(
        'LlmService.embedInput response:',
        response.data[0].embedding.length,
      );

      return { embedding: response.data[0].embedding };
    } catch (error) {
      console.error('Error in LlmService.embedInput:', error);
      return null;
    }
  }

  async answerMessage(
    message: string,
    previousMessageId: string | null = null,
  ): Promise<(AnswerMessage & { responseId: string }) | null> {
    try {
      console.log('LlmService.answerMessage called with message:', message);
      const response = await this.client.responses.parse({
        previous_response_id: previousMessageId,
        model: 'gpt-4.1-nano',
        instructions: LlmService.ANSWER_MESSAGE_PROMPT,
        input: message,
        text: {
          format: zodTextFormat(answerMessageSchema, 'answerSchema'),
        },
      });
      console.log(
        'LlmService.answerMessage response:',
        JSON.stringify(response.output_parsed, null, 2),
      );

      if (!response.output_parsed) {
        console.error(
          'No parsed output in response:',
          JSON.stringify(response),
        );
        return null;
      }

      return {
        ...response.output_parsed,
        responseId: response.id,
      };
    } catch (error) {
      console.error('Error in LlmService.answerMessage:', error);
      return null;
    }
  }
}
