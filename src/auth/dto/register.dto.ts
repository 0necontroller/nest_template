import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Length,
  IsBoolean,
  Equals,
  IsIn,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ type: 'string' })
  @IsEmail()
  email: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ type: 'string', description: '2-character ISO country code' })
  @IsString()
  @Length(2, 2)
  country: string;

  @ApiProperty({ type: 'boolean', description: 'Must accept terms and conditions' })
  @IsBoolean()
  @Equals(true)
  acceptedTerms: boolean;

  @ApiProperty({
    type: 'string',
    enum: ['USER', 'ADMIN'],
    description: 'Role of the registering user (only USER and ADMIN are allowed)',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['USER', 'ADMIN'])
  role: string;
}
