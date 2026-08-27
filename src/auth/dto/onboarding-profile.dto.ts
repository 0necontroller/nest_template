import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, Length } from 'class-validator';

export class OnboardingProfileDto {
  @ApiProperty({
    type: 'string',
    enum: ['USER', 'ADMIN'],
    description: 'Onboarded user role (only USER and ADMIN allowed)',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['USER', 'ADMIN'])
  role: string;

  @ApiProperty({
    type: 'string',
    description: '2-character ISO country code',
    example: 'US',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  country: string;
}
