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
  @ApiOperation({ summary: 'Recibir una lectura de pórtico (evento del TAG)' })
  @ApiResponse({ status: 200, description: 'Lectura procesada' })
  async recibirLectura(@Body() dto: LecturaPorticoDto) {
    const resultado = await this.procesarLectura.ejecutar({
      placa: dto.placa,
      portico: dto.portico,
      nivelConfianza: dto.nivelConfianza,
      timestampLectura: new Date(dto.timestampLectura),
    });

    // Si no hay encargo vigente, retornar solo el estado
    if (!resultado.eventoLectura) {
      return {
        registrada: resultado.registrada,
        notificada: resultado.notificada,
        motivo: resultado.motivo ?? null,
      };
    }

    // Retornar el evento de lectura para que el frontend lo muestre en la tabla
    const evento = resultado.eventoLectura;
    return {
      id: evento.id,
      placa: evento.placa,
      portico: evento.portico,
      nivelConfianza: evento.nivelConfianza,
      notificado: resultado.notificada,
      timestampLectura: evento.timestampLectura,
      createdAt: evento.createdAt,
      registrada: resultado.registrada,
      motivo: resultado.motivo ?? null,
    };
  }
}