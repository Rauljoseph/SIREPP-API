import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProcesarLecturaUseCase } from '../../../application';
import { LecturaPorticoDto } from './dto/lectura-portico.dto';

@ApiTags('Trazabilidad')
@Controller('api/lecturas')
export class TrazabilidadController {
  constructor(
    private readonly procesarLectura: ProcesarLecturaUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recibir una lectura de pórtico (desde el simulador)' })
  @ApiResponse({ status: 200, description: 'Lectura procesada' })
  async recibirLectura(@Body() dto: LecturaPorticoDto) {
    const resultado = await this.procesarLectura.ejecutar({
      placa: dto.placa,
      portico: dto.portico,
      nivelConfianza: dto.nivelConfianza,
      timestampLectura: new Date(dto.timestampLectura),
    });

    return {
      registrada: resultado.registrada,
      notificada: resultado.notificada,
      motivo: resultado.motivo ?? null,
    };
  }
}