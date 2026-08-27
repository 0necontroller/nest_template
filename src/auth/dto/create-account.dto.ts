import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({
    type: 'string',
  })
  type: string;

  @ApiProperty({
    type: 'string',
  })
  provider: string;

  @ApiProperty({
    type: 'string',
  })
  providerAccountId: string;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: true,
  })
  passwordHash?: string | null;
}
