import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class PasswordResetConfirmDto {
  @ApiProperty({
    type: 'string',
    description: 'Temporary password reset token from email link',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ type: 'string', description: 'New password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
