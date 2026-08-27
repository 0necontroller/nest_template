import { ApiProperty } from '@nestjs/swagger';

export class AccountDto {
  @ApiProperty({
    type: 'string',
  })
  id: string;

  @ApiProperty({
    type: 'string',
  })
  userId: string;

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
    nullable: true,
  })
  passwordHash: string | null;
}
