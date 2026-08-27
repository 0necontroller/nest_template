import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  message: string;
  uptime: number;
}

@Injectable()
export class AppService {
  healthCheck(): HealthStatus {
    return {
      message: 'Server is healthy',
      uptime: +process.uptime().toFixed(2),
    };
  }
}
