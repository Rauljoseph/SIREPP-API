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
} from '../../../application';
import { CrearEncargoDto } from './dto/crear-encargo.dto';
import { AnularEncargoDto } from './dto/anular-encargo.dto';

import { Funcionario, type FuncionarioAutenticado } from '../../../shared/auth/funcionario.decorator';

@ApiTags('Encargos')
@Controller('api/encargos')
export class EncargosController {
  constructor(
    private readonly registrarEncargo: RegistrarEncargoUseCase,
    private readonly anularEncargo: AnularEncargoUseCase,
    private readonly consultarEncargo: ConsultarEncargoUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo encargo de placa' })
  @ApiResponse({ status: 201, description: 'Encargo registrado exitosamente' })
  async crear(@Body() dto: CrearEncargoDto, @Funcionario() funcionario: FuncionarioAutenticado) {


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
      unidadId: funcionario.unidadId,
      funcionarioId: funcionario.id,
    });

    return {
      encargo: this.mapearEncargo(resultado.encargo),
      conciliacion: resultado.conciliacion,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un encargo por ID' })
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
  async anular(@Param('id') id: string, @Body() dto: AnularEncargoDto, @Funcionario() funcionario: FuncionarioAutenticado) {

    const encargo = await this.anularEncargo.ejecutar({
      encargoId: id,
      supervisorId: funcionario.id,
      motivo: dto.motivo,
    });
    return this.mapearEncargo(encargo);
  }

  private mapearEncargo(encargo: any) {
    if (!encargo) return null;
    return {
      id: encargo.id,
      placa: encargo.placa,
      tipoEvento: encargo.tipoEvento,
      estado: encargo.estado,
      canalNotificacion: encargo.canalNotificacion,
      constanciaNumero: encargo.constanciaNumero ?? null,
      fechaHecho: encargo.fechaHecho,
      observaciones: encargo.observaciones ?? null,
      unidadId: encargo.unidadId,
      funcionarioId: encargo.funcionarioId,
      createdAt: encargo.createdAt,
    };
  }
}