import { Controller, Get, Patch, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { EventoDominioService } from './evento_dominio.service';

@ApiTags('Eventos de Dominio')
@Controller('api/eventos')
export class EventoDominioController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventoDominioService: EventoDominioService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar eventos de dominio' })
  @ApiQuery({ name: 'tipo', required: false })
  @ApiQuery({ name: 'procesado', required: false, type: Boolean })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  async listar(
    @Query('tipo') tipo?: string,
    @Query('procesado') procesado?: string,
    @Query('limite') limite?: string,
  ) {
    const where: any = {};

    if (tipo) where.tipo = tipo;
    if (procesado !== undefined && procesado !== '') {
      where.procesado = procesado === 'true';
    }

    const eventos = await this.prisma.eventoDominio.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limite ? parseInt(limite) : 100,
    });

    return {
      total: eventos.length,
      eventos,
    };
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen de eventos por tipo' })
  async resumen() {
    const [porTipo, pendientes, totalEventos] = await Promise.all([
      this.prisma.eventoDominio.groupBy({
        by: ['tipo'],
        _count: true,
        orderBy: { _count: { tipo: 'desc' } },
      }),
      this.prisma.eventoDominio.count({ where: { procesado: false } }),
      this.prisma.eventoDominio.count(),
    ]);

    return {
      totalEventos,
      pendientes,
      porTipo: porTipo.map((r) => ({
        tipo: r.tipo,
        total: r._count,
      })),
    };
  }

  @Patch(':id/procesar')
  @ApiOperation({ summary: 'Marcar evento como procesado' })
  async marcarProcesado(@Param('id', ParseIntPipe) id: number) {
    return this.eventoDominioService.marcarProcesado(id);
  }
}