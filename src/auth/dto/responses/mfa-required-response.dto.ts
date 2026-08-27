import { ApiProperty } from '@nestjs/swagger';
import { ResponseMetaDto } from './meta-response.dto';

export class MfaRequiredResponseDto {
  @ApiProperty({ type: 'boolean', example: true })
  mfa_required: boolean;

  @ApiProperty({ type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  mfa_token: string;

  @ApiProperty({ type: 'number', example: 300 })
  expires_in_seconds: number;
}

export class MfaRequiredSuccessResponseDto {
  @ApiProperty({ type: 'string', example: 'success' })
  status: string;

  @ApiProperty({ type: 'string', example: 'MFA verification required' })
  message: string;

  @ApiProperty({ type: () => MfaRequiredResponseDto })
  data: MfaRequiredResponseDto;

  @ApiProperty({ type: () => ResponseMetaDto })
  meta: ResponseMetaDto;
}
