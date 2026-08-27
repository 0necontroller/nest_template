import { ApiProperty } from '@nestjs/swagger';
import { ResponseMetaDto } from './meta-response.dto';

export class UserResponseDto {
  @ApiProperty({ type: 'string', example: '01908d1f-8e3b-741a-a38f-a9cb8561d6bc' })
  id: string;

  @ApiProperty({ type: 'string', example: 'user@example.com' })
  email: string;

  @ApiProperty({ type: 'string', example: 'John' })
  firstName: string;

  @ApiProperty({ type: 'string', example: 'Doe' })
  lastName: string;

  @ApiProperty({ type: 'string', example: 'USER' })
  role: string;

  @ApiProperty({ type: 'string', example: 'PENDING_VERIFICATION' })
  status: string;

  @ApiProperty({ type: 'string', example: 'US' })
  country: string;

  @ApiProperty({ type: 'boolean', example: false })
  isEmailVerified: boolean;

  @ApiProperty({ type: 'boolean', example: false })
  isTwoFactorAuthenticationEnabled: boolean;
}

export class UserSuccessResponseDto {
  @ApiProperty({ type: 'string', example: 'success' })
  status: string;

  @ApiProperty({ type: 'string', example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ type: () => UserResponseDto })
  data: UserResponseDto;

  @ApiProperty({ type: () => ResponseMetaDto })
  meta: ResponseMetaDto;
}
