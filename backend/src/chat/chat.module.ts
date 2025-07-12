import { PostgresService } from '@/shared/postgres.service';
import { Module } from '@nestjs/common';
import { LlmModule } from '../shared/llm/llm.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [LlmModule],
  controllers: [ChatController],
  providers: [PostgresService, ChatService],
})
export class ChatModule {}
