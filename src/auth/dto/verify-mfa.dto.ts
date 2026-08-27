import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyMfaDto {
  @ApiProperty({ type: 'string', description: 'Temporary MFA Intent Token' })
  @IsString()
  @IsNotEmpty()
  mfaToken: string;

  @ApiProperty({ type: 'string', description: '6-digit TOTP code' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
