import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
// ⚠️ Si el import de PrismaService da error, copia la ruta que usa tu dashboard.controller.ts

@ApiTags('Auditoría')
@Controller('api/audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar registros de auditoría' })
  @ApiQuery({ name: 'usuarioId', required: false })
  @ApiQuery({ name: 'entidad', required: false })
  @ApiQuery({ name: 'accion', required: false })
  @ApiQuery({ name: 'desde', required: false, description: 'Fecha inicio ISO' })
  @ApiQuery({ name: 'hasta', required: false, description: 'Fecha fin ISO' })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  async listar(
    @Query('usuarioId') usuarioId?: string,
    @Query('entidad') entidad?: string,
    @Query('accion') accion?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('limite') limite?: string,
  ) {
    const where: any = {};

    if (usuarioId) where.usuarioId = usuarioId;
    if (entidad) where.entidad = entidad;
    if (accion) where.accion = accion;
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde);
      if (hasta) where.createdAt.lte = new Date(hasta);
    }

    const registros = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limite ? parseInt(limite) : 100,
      include: {
        usuario: {
          select: { nombreCompleto: true, email: true, rol: true },
        },
      },
    });

    return {
      total: registros.length,
      registros,
    };
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen de actividad por entidad' })
  async resumen() {
    const [porEntidad, porAccion, recientes] = await Promise.all([
      this.prisma.auditLog.groupBy({
        by: ['entidad'],
        _count: true,
        orderBy: { _count: { entidad: 'desc' } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['accion'],
        _count: true,
        orderBy: { _count: { accion: 'desc' } },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      totalRegistros: recientes,
      porEntidad: porEntidad.map((r) => ({
        entidad: r.entidad,
        total: r._count,
      })),
      porAccion: porAccion.map((r) => ({
        accion: r.accion,
        total: r._count,
      })),
    };
  }
}