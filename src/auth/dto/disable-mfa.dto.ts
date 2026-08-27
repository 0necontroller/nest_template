import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class DisableMfaDto {
  @ApiProperty({ type: 'string', description: '6-digit TOTP code to authorize deactivation' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
