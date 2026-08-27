import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    type: 'string',
  })
  sessionToken: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  expires: Date;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: true,
  })
  userAgent?: string | null;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: true,
  })
  ipAddress?: string | null;
}
