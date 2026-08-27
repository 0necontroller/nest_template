import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Permission, RolePermissionsMap } from '../../common/permissions';
import { AuditLogService } from '../../audit/audit-log.service';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private auditLog: AuditLogService,
    private redisService: RedisService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Strict Deny-All Default: Endpoints without metadata are blocked
    if (!requiredPermissions) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assumes authentication guard ran before this (e.g. JwtAuthGuard)

    if (!user || !user.id) {
      throw new ForbiddenException(
        'Access Denied: Missing session identifier.',
      );
    }

    // Try to get user role from Redis cache
    const cacheKey = `user-role:${user.id}`;
    let userRole = await this.redisService.get(cacheKey);

    if (!userRole) {
      // Fallback: Query database
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      if (!dbUser) {
        throw new ForbiddenException('Access Denied: User record not found.');
      }

      userRole = dbUser.role;
      // Cache role in Redis with 5-minute TTL (300 seconds)
      await this.redisService.set(cacheKey, userRole, 300);
    }

    // Lookup user permission bindings
    const permissions =
      RolePermissionsMap[userRole as keyof typeof RolePermissionsMap] || [];
    const hasPermission = requiredPermissions.every((perm) =>
      permissions.includes(perm),
    );

    if (!hasPermission) {
      // Trigger immutable regulatory audit logging on security breaches
      await this.auditLog.write({
        eventType: 'UNAUTHORIZED_ACCESS',
        userId: user.id,
        userRole: userRole,
        action: `Attempted execution requiring: ${requiredPermissions.join(', ')}`,
        resourceType: context.getClass().name,
        resourceId: request.params?.id || 'GLOBAL',
        ipAddress: request.ip,
        correlationId: request.headers['x-correlation-id'],
        outcome: 'failure',
      });

      throw new ForbiddenException(
        'Access Denied: Insufficient authorization permissions.',
      );
    }

    return true;
  }
}
