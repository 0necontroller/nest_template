import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/prisma/generated/prisma/enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: [UserRole, ...UserRole[]]) =>
  SetMetadata(ROLES_KEY, roles);
