import { uuidv7 } from 'uuidv7';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async write(data: {
    eventType: string;
    userId?: string;
    userRole?: string;
    action: string;
    resourceType: string;
    resourceId: string;
    ipAddress?: string;
    correlationId?: string;
    outcome: string;
    metadata?: any;
  }) {
    // correlationId is required as UUID in schema; generate one if not present or invalid
    let correlationId = data.correlationId;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!correlationId || !uuidRegex.test(correlationId)) {
      correlationId = uuidv7();
    }

    return this.prisma.auditLog.create({
      data: {
        eventType: data.eventType,
        userId: data.userId,
        userRole: data.userRole,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        correlationId: correlationId,
        outcome: data.outcome,
        metadata: data.metadata || {},
      },
    });
  }
}
