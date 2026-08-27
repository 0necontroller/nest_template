import { ApiProperty } from '@nestjs/swagger';

export class UpdateSessionDto {
  @ApiProperty({
    type: 'string',
    required: false,
  })
  sessionToken?: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: false,
  })
  expires?: Date;

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
