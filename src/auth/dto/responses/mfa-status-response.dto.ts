import { ApiProperty } from '@nestjs/swagger';
import { ResponseMetaDto } from './meta-response.dto';

export class MfaStatusDto {
  @ApiProperty({ type: 'boolean', example: false })
  mfaEnabled: boolean;
}

export class MfaStatusSuccessResponseDto {
  @ApiProperty({ type: 'string', example: 'success' })
  status: string;

  @ApiProperty({ type: 'string', example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ type: () => MfaStatusDto })
  data: MfaStatusDto;

  @ApiProperty({ type: () => ResponseMetaDto })
  meta: ResponseMetaDto;
}
