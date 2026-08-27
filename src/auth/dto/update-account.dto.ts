import { ApiProperty } from '@nestjs/swagger';

export class UpdateAccountDto {
  @ApiProperty({
    type: 'string',
    required: false,
  })
  type?: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  provider?: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  providerAccountId?: string;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: true,
  })
  passwordHash?: string | null;
}
