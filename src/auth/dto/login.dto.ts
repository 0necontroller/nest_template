import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsBoolean, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    type: 'string',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    type: 'boolean',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}
