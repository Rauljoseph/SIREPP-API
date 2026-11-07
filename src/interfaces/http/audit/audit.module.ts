import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

@Module({
  controllers: [AuditController],
  providers: [AuditLogService, PrismaService],
  exports: [AuditLogService],
})
export class AuditModule {}