import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  RegistrarHallazgoUseCase,
  ConsultarHallazgoUseCase,
  ConciliarPlacaUseCase,
  EnviarNotificacionReunificacionUseCase,
} from '../../../application';
import { CrearHallazgoDto } from './dto/crear-hallazgo.dto';

@ApiTags('Hallazgos')
@Controller('api/hallazgos')
export class HallazgosController {
  constructor(
    private readonly registrarHallazgo: RegistrarHallazgoUseCase,
    private readonly consultarHallazgo: ConsultarHallazgoUseCase,
    private readonly conciliarPlaca: ConciliarPlacaUseCase,
    private readonly enviarNotificacion: EnviarNotificacionReunificacionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un hallazgo de placa' })
  @ApiResponse({ status: 201, description: 'Hallazgo registrado' })
  async crear(@Body() dto: CrearHallazgoDto) {
    const funcionarioId = '00000000-0000-0000-0000-000000000000';

    const hallazgo = await this.registrarHallazgo.ejecutar({
      placa: dto.placa,
      estadoFisico: dto.estadoFisico,
      observaciones: dto.observaciones,
      unidadId: dto.unidadId,
      funcionarioId,
    });

    // Intentar conciliación automática
    const conciliacion = await this.conciliarPlaca.desdeHallazgo({
      hallazgoId: hallazgo.id,
      placa: hallazgo.placa,
    });

    if (conciliacion.conciliada && conciliacion.reunificacion) {
      await this.enviarNotificacion.ejecutar({
        reunificacionId: conciliacion.reunificacion.id,
      });
    }

    return {
      hallazgo: {
        id: hallazgo.id,
        placa: hallazgo.placa,
        estadoFisico: hallazgo.estadoFisico,
        observaciones: hallazgo.observaciones,
        unidadId: hallazgo.unidadId,
        createdAt: hallazgo.createdAt,
      },
      conciliacion: conciliacion.conciliada
        ? {
          reunificacionId: conciliacion.reunificacion!.id,
          mensaje: 'Se encontró un encargo vigente. La placa fue reunificada automáticamente.',
        }
        : null,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un hallazgo por ID' })
  async buscarPorId(@Param('id') id: string) {
    const hallazgo = await this.consultarHallazgo.porId(id);
    return {
      id: hallazgo.id,
      placa: hallazgo.placa,
      estadoFisico: hallazgo.estadoFisico,
      observaciones: hallazgo.observaciones,
      unidadId: hallazgo.unidadId,
      createdAt: hallazgo.createdAt,
    };
  }

  @Get('placa/:placa')
  @ApiOperation({ summary: 'Consultar hallazgos por placa' })
  async buscarPorPlaca(@Param('placa') placa: string) {
    const hallazgos = await this.consultarHallazgo.porPlaca(placa);
    return hallazgos.map((h) => ({
      id: h.id,
      placa: h.placa,
      estadoFisico: h.estadoFisico,
      observaciones: h.observaciones,
      unidadId: h.unidadId,
      createdAt: h.createdAt,
    }));
  }
}