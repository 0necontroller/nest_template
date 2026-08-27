import { ApiProperty } from '@nestjs/swagger';

export class SessionDto {
  @ApiProperty({
    type: 'string',
  })
  id: string;

  @ApiProperty({
    type: 'string',
  })
  sessionToken: string;

  @ApiProperty({
    type: 'string',
  })
  userId: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  expires: Date;

  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  userAgent: string | null;

  @ApiProperty({
    type: 'string',
    nullable: true,
  })
  ipAddress: string | null;
}
