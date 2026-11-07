import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
// ⚠️ Si el import de PrismaService da error, copia la ruta que usa tu dashboard.controller.ts

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(params: {
    usuarioId: string;
    accion: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' | 'CONSULTAR';
    entidad: string;
    entidadId?: string;
    detalle?: Record<string, any>;
    ip: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        usuarioId: params.usuarioId,
        accion: params.accion,
        entidad: params.entidad,
        entidadId: params.entidadId,
        detalle: params.detalle ?? undefined,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  }
}