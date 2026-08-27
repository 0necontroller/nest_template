import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

import { Public } from './auth/decorators/public.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'Checks if the server is healthy.',
  })
  healthCheck() {
    return this.appService.healthCheck();
  }
}
