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
} from '../../../application';
import { CrearHallazgoDto } from './dto/crear-hallazgo.dto';

@ApiTags('Hallazgos')
@Controller('api/hallazgos')
export class HallazgosController {
  constructor(
    private readonly registrarHallazgo: RegistrarHallazgoUseCase,
    private readonly consultarHallazgo: ConsultarHallazgoUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un hallazgo de placa' })
  async crear(@Body() dto: CrearHallazgoDto) {
    const funcionarioId = '00000000-0000-0000-0000-000000000000';

    const resultado = await this.registrarHallazgo.ejecutar({
      placa: dto.placa,
      estadoFisico: dto.estadoFisico,
      observaciones: dto.observaciones,
      unidadId: dto.unidadId,
      funcionarioId,
    });

    return {
      hallazgo: this.mapearHallazgo(resultado.hallazgo),
      conciliacion: resultado.conciliacion,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un hallazgo por ID' })
  async buscarPorId(@Param('id') id: string) {
    const hallazgo = await this.consultarHallazgo.porId(id);
    return this.mapearHallazgo(hallazgo);
  }

  @Get('placa/:placa')
  @ApiOperation({ summary: 'Consultar hallazgos por placa' })
  async buscarPorPlaca(@Param('placa') placa: string) {
    const hallazgos = await this.consultarHallazgo.porPlaca(placa);
    return hallazgos.map((h) => this.mapearHallazgo(h));
  }

  private mapearHallazgo(hallazgo: any) {
    if (!hallazgo) return null;
    return {
      id: hallazgo.id,
      placa: hallazgo.placa,
      estadoFisico: hallazgo.estadoFisico,
      observaciones: hallazgo.observaciones ?? null,
      unidadId: hallazgo.unidadId,
      createdAt: hallazgo.createdAt,
    };
  }
}