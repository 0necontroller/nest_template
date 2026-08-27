import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    type: 'string',
    required: false,
  })
  email?: string;
  @ApiProperty({
    type: 'string',
    required: false,
  })
  firstName?: string;
  @ApiProperty({
    type: 'string',
    required: false,
  })
  lastName?: string;
}
