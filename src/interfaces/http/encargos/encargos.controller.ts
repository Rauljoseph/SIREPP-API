import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  RegistrarEncargoUseCase,
  AnularEncargoUseCase,
  ConsultarEncargoUseCase,
  ConciliarPlacaUseCase,
  EnviarNotificacionReunificacionUseCase,
  ConsultarHallazgoUseCase,
  ConsultarUnidadUseCase,
} from '../../../application';
import { CrearEncargoDto } from './dto/crear-encargo.dto';
import { AnularEncargoDto } from './dto/anular-encargo.dto';

@ApiTags('Encargos')
@Controller('api/encargos')
export class EncargosController {
  constructor(
    private readonly registrarEncargo: RegistrarEncargoUseCase,
    private readonly anularEncargo: AnularEncargoUseCase,
    private readonly consultarEncargo: ConsultarEncargoUseCase,
    private readonly conciliarPlaca: ConciliarPlacaUseCase,
    private readonly enviarNotificacion: EnviarNotificacionReunificacionUseCase,
    private readonly consultarHallazgo: ConsultarHallazgoUseCase,
    private readonly consultarUnidad: ConsultarUnidadUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo encargo de placa' })
  @ApiResponse({ status: 201, description: 'Encargo registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o placa no existe' })
  @ApiResponse({ status: 409, description: 'Ya existe un encargo vigente para esta placa' })
  async crear(@Body() dto: CrearEncargoDto) {
    const funcionarioId = '00000000-0000-0000-0000-000000000000';

    const resultado = await this.registrarEncargo.ejecutar({
      placa: dto.placa,
      tipoEvento: dto.tipoEvento,
      denuncianteRut: dto.denuncianteRut,
      denuncianteNombre: dto.denuncianteNombre,
      denuncianteEmail: dto.denuncianteEmail,
      canalNotificacion: dto.canalNotificacion ?? 'EMAIL',
      constanciaNumero: dto.constanciaNumero,
      fechaHecho: new Date(dto.fechaHecho),
      observaciones: dto.observaciones,
      unidadId: dto.unidadId,
      funcionarioId,
    });

    // Intentar conciliación automática
    const conciliacion = await this.conciliarPlaca.desdeEncargo({
      encargoId: resultado.encargo.id,
      placa: resultado.encargo.placa,
    });

    // Si se concilió, notificar y buscar dónde está la placa
    let conciliacionResponse: any = null;
    if (conciliacion.conciliada && conciliacion.reunificacion) {
      await this.enviarNotificacion.ejecutar({
        reunificacionId: conciliacion.reunificacion.id,
      });

      const hallazgo = await this.consultarHallazgo.porId(
        conciliacion.reunificacion.hallazgoId,
      );
      const unidadCustodia = await this.consultarUnidad.porId(hallazgo.unidadId);

      conciliacionResponse = {
        reunificacionId: conciliacion.reunificacion.id,
        mensaje:
          'Esta placa ya fue encontrada y se encuentra disponible para retiro.',
        hallazgo: {
          id: hallazgo.id,
          estadoFisico: hallazgo.estadoFisico,
          fechaHallazgo: hallazgo.createdAt,
        },
        unidadCustodia: unidadCustodia
          ? {
            nombre: unidadCustodia.nombre,
            direccion: unidadCustodia.direccion,
            comuna: unidadCustodia.comuna,
            region: unidadCustodia.region,
            horarioAtencion: unidadCustodia.horarioAtencion,
            telefono: unidadCustodia.telefono,
          }
          : null,
      };
    }

    return {
      encargo: this.mapearEncargo(resultado.encargo),
      conciliacion: conciliacionResponse,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un encargo por ID' })
  @ApiResponse({ status: 200, description: 'Encargo encontrado' })
  @ApiResponse({ status: 404, description: 'Encargo no encontrado' })
  async buscarPorId(@Param('id') id: string) {
    const encargo = await this.consultarEncargo.porId(id);
    return this.mapearEncargo(encargo);
  }

  @Get('placa/:placa')
  @ApiOperation({ summary: 'Consultar encargos por placa' })
  async buscarPorPlaca(@Param('placa') placa: string) {
    const encargos = await this.consultarEncargo.porPlaca(placa);
    return encargos.map((e) => this.mapearEncargo(e));
  }

  @Patch(':id/anular')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Anular un encargo vigente' })
  @ApiResponse({ status: 200, description: 'Encargo anulado' })
  @ApiResponse({ status: 404, description: 'Encargo no encontrado' })
  async anular(@Param('id') id: string, @Body() dto: AnularEncargoDto) {
    const supervisorId = '00000000-0000-0000-0000-000000000000';

    const encargo = await this.anularEncargo.ejecutar({
      encargoId: id,
      supervisorId,
      motivo: dto.motivo,
    });

    return this.mapearEncargo(encargo);
  }

  private mapearEncargo(encargo: any) {
    return {
      id: encargo.id,
      placa: encargo.placa,
      tipoEvento: encargo.tipoEvento,
      estado: encargo.estado,
      canalNotificacion: encargo.canalNotificacion,
      constanciaNumero: encargo.constanciaNumero,
      fechaHecho: encargo.fechaHecho,
      observaciones: encargo.observaciones,
      unidadId: encargo.unidadId,
      funcionarioId: encargo.funcionarioId,
      createdAt: encargo.createdAt,
    };
  }
}