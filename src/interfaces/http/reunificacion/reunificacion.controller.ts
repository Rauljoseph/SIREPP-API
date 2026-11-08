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
import { CerrarCasoUseCase } from '../../../application';
import { CerrarCasoDto } from './dto/cerrar-caso.dto';

import { Funcionario, type FuncionarioAutenticado } from '../../../shared/auth/funcionario.decorator';

@ApiTags('Reunificación')
@Controller('api/reunificaciones')
export class ReunificacionController {
  constructor(
    private readonly cerrarCaso: CerrarCasoUseCase,
  ) {}

  @Post(':id/entregar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar la entrega de la placa al propietario y cerrar el caso' })
  @ApiResponse({ status: 200, description: 'Caso cerrado exitosamente' })
  @ApiResponse({ status: 404, description: 'Reunificación no encontrada' })
  async entregar(@Param('id') id: string, @Body() dto: CerrarCasoDto, @Funcionario() funcionario: FuncionarioAutenticado) {


    const reunificacion = await this.cerrarCaso.ejecutar({
      reunificacionId: id,
      funcionarioEntregaId: funcionario.id,
      receptorRut: dto.receptorRut,
      receptorNombre: dto.receptorNombre,
    });

    return {
      id: reunificacion.id,
      encargoId: reunificacion.encargoId,
      hallazgoId: reunificacion.hallazgoId,
      estado: reunificacion.estado,
      fechaEntrega: reunificacion.fechaEntrega,
      mensaje: 'Placa entregada al propietario. Caso cerrado.',
    };
  }
}