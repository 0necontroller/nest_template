import { ApiProperty } from '@nestjs/swagger';

export class ConnectSessionDto {
  @ApiProperty({
    type: 'string',
    required: false,
  })
  id?: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  sessionToken?: string;
}
