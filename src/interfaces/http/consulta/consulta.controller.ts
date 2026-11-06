import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConsultarEstadoPlacaUseCase } from '../../../application';

@ApiTags('Consulta operativa')
@Controller('api/consulta')
export class ConsultaController {
  constructor(
    private readonly consultarEstado: ConsultarEstadoPlacaUseCase,
  ) {}

  @Get('placa/:placa')
  @ApiOperation({ summary: 'Consultar el estado completo de una placa (uso en vía pública)' })
  @ApiResponse({ status: 200, description: 'Estado de la placa' })
  async consultarPlaca(@Param('placa') placa: string) {
    const estado = await this.consultarEstado.ejecutar(placa);

    return {
      placa: estado.placa,
      resumen: estado.resumen,
      encargo: estado.encargo
        ? {
          id: estado.encargo.id,
          tipoEvento: estado.encargo.tipoEvento,
          estado: estado.encargo.estado,
          fechaHecho: estado.encargo.fechaHecho,
          createdAt: estado.encargo.createdAt,
        }
        : null,
      hallazgos: estado.hallazgos.map((h) => ({
        id: h.id,
        estadoFisico: h.estadoFisico,
        unidadId: h.unidadId,
        createdAt: h.createdAt,
      })),
      reunificacion: estado.reunificacion
        ? {
          id: estado.reunificacion.id,
          estado: estado.reunificacion.estado,
          fechaConciliacion: estado.reunificacion.fechaConciliacion,
          fechaEntrega: estado.reunificacion.fechaEntrega,
          receptorRut: estado.reunificacion.receptorRut,
          receptorNombre: estado.reunificacion.receptorNombre,
        }
        : null,
    };
  }
}