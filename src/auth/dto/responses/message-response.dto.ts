import { ApiProperty } from '@nestjs/swagger';
import { ResponseMetaDto } from './meta-response.dto';

export class MessageResponseDto {
  @ApiProperty({ type: 'string', example: 'Operation completed successfully' })
  message: string;
}

export class MessageResponseEnvelopeDto {
  @ApiProperty({ type: 'string', example: 'success' })
  status: string;

  @ApiProperty({ type: 'string', example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ type: 'object', additionalProperties: true, example: {} })
  data: any;

  @ApiProperty({ type: () => ResponseMetaDto })
  meta: ResponseMetaDto;
}
