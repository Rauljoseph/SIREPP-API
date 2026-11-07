import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { CrearUnidadDto } from './dto/crear-unidad.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Administración')
@Controller('api/admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  // ── UNIDADES ────────────────────────────────────────────

  @Get('unidades')
  @ApiOperation({ summary: 'Listar todas las unidades' })
  async listarUnidades() {
    return this.prisma.unidad.findMany({
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { usuarios: true } } },
    });
  }

  @Post('unidades')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva unidad' })
  @ApiResponse({ status: 201, description: 'Unidad creada exitosamente' })
  async crearUnidad(@Body() dto: CrearUnidadDto) {
    const unidad = await this.prisma.unidad.create({
      data: {
        nombre: dto.nombre,
        tipo: dto.tipo,
        direccion: dto.direccion,
        region: dto.region,
        comuna: dto.comuna,
        horarioAtencion: dto.horarioAtencion,
        telefono: dto.telefono,
      },
    });
    return unidad;
  }

  @Delete('unidades/:id')
  @ApiOperation({ summary: 'Eliminar una unidad' })
  async eliminarUnidad(@Param('id') id: string) {
    await this.prisma.unidad.delete({ where: { id } });
    return { message: 'Unidad eliminada' };
  }

  // ── USUARIOS ────────────────────────────────────────────

  @Get('usuarios')
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  async listarUsuarios() {
    return this.prisma.usuario.findMany({
      orderBy: { nombreCompleto: 'asc' },
      include: { unidad: { select: { id: true, nombre: true } } },
    });
  }

  @Post('usuarios')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  async crearUsuario(@Body() dto: CrearUsuarioDto) {
    const usuario = await this.prisma.usuario.create({
      data: {
        nombreCompleto: dto.nombreCompleto,
        email: dto.email,
        rol: dto.rol,
        unidadId: dto.unidadId,
        keycloakSub: `local-${uuidv4()}`,
        servicioActivo: true,
      },
      include: { unidad: { select: { id: true, nombre: true } } },
    });
    return usuario;
  }

  @Delete('usuarios/:id')
  @ApiOperation({ summary: 'Eliminar un usuario' })
  async eliminarUsuario(@Param('id') id: string) {
    await this.prisma.usuario.delete({ where: { id } });
    return { message: 'Usuario eliminado' };
  }
}