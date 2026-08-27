import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class PasswordResetRequestDto {
  @ApiProperty({ type: 'string', description: 'Registered email address of user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
