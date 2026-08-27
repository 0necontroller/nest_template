import { ApiProperty } from '@nestjs/swagger';

export class ResponseMetaDto {
  @ApiProperty({ type: 'string', example: '2026-07-09T10:40:00.000Z' })
  timestamp: string;
}
