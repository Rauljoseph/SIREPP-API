import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
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

  @Get()
  @ApiOperation({ summary: 'Listar encargos con filtro opcional por estado y paginación' })
  @ApiQuery({ name: 'estado', required: false, enum: ['VIGENTE', 'REUNIFICADO', 'CERRADO', 'ANULADO', 'EXPIRADO'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de encargos' })
  async listar(
    @Query('estado') estado?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    const result = await this.consultarEncargo.listarPorEstado(estado, p, l);
    return {
      data: result.data.map((e) => this.mapearEncargo(e)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

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
      denuncianteRut: encargo.denuncianteRut ?? null,
      denuncianteNombre: encargo.denuncianteNombre ?? null,
      denuncianteEmail: encargo.denuncianteEmail ?? null,
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