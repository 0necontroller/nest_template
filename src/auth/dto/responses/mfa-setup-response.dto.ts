import { ApiProperty } from '@nestjs/swagger';
import { ResponseMetaDto } from './meta-response.dto';

export class MfaSetupResponseDto {
  @ApiProperty({ type: 'string', example: 'NBSWY3DPEB3W64TBNQ' })
  secret: string;

  @ApiProperty({ type: 'string', example: 'data:image/png;base64,iVBORw0KGgoAAAANS...' })
  qrCode: string;
}

export class MfaSetupSuccessResponseDto {
  @ApiProperty({ type: 'string', example: 'success' })
  status: string;

  @ApiProperty({ type: 'string', example: 'MFA setup initiated' })
  message: string;

  @ApiProperty({ type: () => MfaSetupResponseDto })
  data: MfaSetupResponseDto;

  @ApiProperty({ type: () => ResponseMetaDto })
  meta: ResponseMetaDto;
}
