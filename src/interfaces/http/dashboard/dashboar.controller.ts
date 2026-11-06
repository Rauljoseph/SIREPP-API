import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

@ApiTags('Dashboard')
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard' })
  async getStats() {
    const [encargosVigentes, hallazgosTotales, reunificacionesPendientes, reunificacionesEntregadas, lecturasSemana] = await Promise.all([
      this.prisma.encargo.count({ where: { estado: 'VIGENTE' } }),
      this.prisma.hallazgo.count(),
      this.prisma.reunificacion.count({ where: { estado: 'PENDIENTE_RETIRO' } }),
      this.prisma.reunificacion.count({ where: { estado: 'ENTREGADA' } }),
      this.prisma.eventoLectura.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ]);
    return { encargosVigentes, hallazgosTotales, reunificacionesPendientes, reunificacionesEntregadas, lecturasSemana };
  }

  @Get('encargos-recientes')
  async getEncargosRecientes() {
    return this.prisma.encargo.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { unidad: true } });
  }

  @Get('reunificaciones-recientes')
  async getReunificacionesRecientes() {
    return this.prisma.reunificacion.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { encargo: true } });
  }
}