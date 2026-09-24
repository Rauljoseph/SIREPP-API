import { Injectable } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { AuditLog } from '../../domain/entities';
import { AuditLoggerPort } from '../../domain/ports';

@Injectable()
export class AuditLoggerPrismaAdapter implements AuditLoggerPort {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(log: AuditLog): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        usuarioId: log.usuarioId,
        accion: log.accion,
        entidad: log.entidad,
        entidadId: log.entidadId,
        detalle: (log.detalle ?? undefined) as any,
        ip: log.ip,
        userAgent: log.userAgent,
      },
    });
  }
}