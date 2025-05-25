import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';

@Injectable()
export class PostgresService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  client: Client;

  constructor(private readonly configService: ConfigService) {
    this.client = new Client({
      host: this.configService.getOrThrow('POSTGRES_HOST'),
      port: Number(this.configService.getOrThrow('POSTGRES_PORT')),
      user: this.configService.getOrThrow('POSTGRES_USER'),
      password: this.configService.getOrThrow('POSTGRES_PASSWORD'),
      database: this.configService.getOrThrow('POSTGRES_DB'),
    });
  }

  async onApplicationBootstrap() {
    await this.client.connect();
  }

  async onApplicationShutdown() {
    await this.client.end();
  }
}
