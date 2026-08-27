import { ApiProperty } from '@nestjs/swagger';
import { ResponseMetaDto } from './meta-response.dto';

export class SuccessResponseDto {
  @ApiProperty({ type: 'boolean', example: true })
  success: boolean;
}

export class SuccessResponseEnvelopeDto {
  @ApiProperty({ type: 'string', example: 'success' })
  status: string;

  @ApiProperty({ type: 'string', example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ type: () => SuccessResponseDto })
  data: SuccessResponseDto;

  @ApiProperty({ type: () => ResponseMetaDto })
  meta: ResponseMetaDto;
}
