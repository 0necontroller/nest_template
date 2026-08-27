import { ApiProperty } from '@nestjs/swagger';

export class ConnectAccountDto {
  @ApiProperty({
    type: 'string',
    required: false,
  })
  id?: string;
}
