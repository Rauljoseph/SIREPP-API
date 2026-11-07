import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { ReintentarNotificacionesUseCase } from '../../../application';
import { NOTIFICACION_REPOSITORY, NotificacionRepository } from '../../../domain/ports';

@ApiTags('Notificaciones')
@Controller('api/notificaciones')
export class NotificacionController {
  constructor(
    @Inject(NOTIFICACION_REPOSITORY)
    private readonly notificacionRepo: NotificacionRepository,
    private readonly reintentarNotificaciones: ReintentarNotificacionesUseCase,
  ) {}

  @Get('fallidas')
  @ApiOperation({ summary: 'Listar notificaciones fallidas reintentables' })
  async listarFallidas() {
    const fallidas = await this.notificacionRepo.buscarFallidasReintentables();
    return {
      total: fallidas.length,
      notificaciones: fallidas.map((n) => ({
        id: n.id,
        destinatarioEmail: n.destinatarioEmail,
        tipo: n.tipo,
        estado: n.estado,
        intentos: n.intentos,
        resultado: n.resultado,
        ultimoIntentoAt: n.ultimoIntentoAt,
        reunificacionId: n.reunificacionId,
        createdAt: n.createdAt,
      })),
    };
  }

  @Post('reintentar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reintentar envío de notificaciones fallidas' })
  async reintentar() {
    const resultado = await this.reintentarNotificaciones.ejecutar();
    return resultado;
  }
}