import { UserRole } from 'src/prisma/generated/prisma/enums';

export enum Permission {
  // User & Role Management
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_USERS = 'VIEW_USERS',
  DEACTIVATE_USER = 'DEACTIVATE_USER',
  ASSIGN_ROLES = 'ASSIGN_ROLES',

  // System & Settings
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  VIEW_ANALYTICS_DASHBOARD = 'VIEW_ANALYTICS_DASHBOARD',
}

export const RolePermissionsMap: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [Permission.VIEW_USERS],

  [UserRole.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.DEACTIVATE_USER,
    Permission.ASSIGN_ROLES,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_ANALYTICS_DASHBOARD,
  ],
};
