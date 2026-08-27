import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private configService: ConfigService) {
    const dbUrl = configService.get<string>('DATABASE_URL');

    const adapter = new PrismaPg({
      connectionString: dbUrl,
    });
    super({ adapter });
  }
}
