import { Module } from "@nestjs/common";
import { LlmService } from "./llm.service";
import { OpenAiLlmService } from "./openai-llm.service";
import { ConfigService } from "@nestjs/config";

@Module({
  providers: [
    {
      provide: LlmService,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>("LLM_PROVIDER");
        if (provider === "openai") {
          return new OpenAiLlmService(configService);
        }

        throw new Error(`Unsupported LLM provider: ${provider}`);
      },
      inject: [ConfigService],
    }
  ],
  exports: [
    LlmService
  ]
})
export class LlmModule {}