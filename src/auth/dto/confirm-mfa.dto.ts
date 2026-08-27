import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ConfirmMfaDto {
  @ApiProperty({ type: 'string', description: '6-digit TOTP code to confirm configuration setup' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
