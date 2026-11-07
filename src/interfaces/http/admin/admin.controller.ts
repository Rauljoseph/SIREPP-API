import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { CrearUnidadDto } from './dto/crear-unidad.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Administración')
@Controller('api/admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── UNIDADES ─────────────────────────────────────

  @Get('unidades')
  @ApiOperation({ summary: 'Listar todas las unidades' })
  async listarUnidades() {
    return this.prisma.unidad.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { usuarios: true } },
      },
    });
  }

  @Post('unidades')
  @ApiOperation({ summary: 'Crear una nueva unidad' })
  async crearUnidad(@Body() dto: CrearUnidadDto) {
    return this.prisma.unidad.create({ data: dto });
  }

  @Delete('unidades/:id')
  @ApiOperation({ summary: 'Eliminar una unidad' })
  async eliminarUnidad(@Param('id') id: string) {
    // Verificar si tiene usuarios asociados
    const count = await this.prisma.usuario.count({
      where: { unidadId: id },
    });

    if (count > 0) {
      throw new BadRequestException(
        `No se puede eliminar esta unidad porque tiene ${count} usuario(s) asociado(s). Elimina o reasigna los usuarios primero.`,
      );
    }

    return this.prisma.unidad.delete({ where: { id } });
  }

  // ─── USUARIOS ─────────────────────────────────────

  @Get('usuarios')
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  async listarUsuarios() {
    return this.prisma.usuario.findMany({
      orderBy: { nombreCompleto: 'asc' },
      include: { unidad: true },
    });
  }

  @Post('usuarios')
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  async crearUsuario(@Body() dto: CrearUsuarioDto) {
    return this.prisma.usuario.create({
      data: {
        ...dto,
        keycloakSub: `local-${uuidv4()}`,
      },
      include: { unidad: true },
    });
  }

  @Delete('usuarios/:id')
  @ApiOperation({ summary: 'Eliminar un usuario' })
  async eliminarUsuario(@Param('id') id: string) {
    // Verificar si tiene encargos asociados
    const encargos = await this.prisma.encargo.count({
      where: { funcionarioId: id },
    });

    if (encargos > 0) {
      throw new BadRequestException(
        `No se puede eliminar este usuario porque tiene ${encargos} encargo(s) asociado(s). Reasigna los encargos primero.`,
      );
    }

    // Verificar si tiene hallazgos asociados
    const hallazgos = await this.prisma.hallazgo.count({
      where: { funcionarioId: id },
    });

    if (hallazgos > 0) {
      throw new BadRequestException(
        `No se puede eliminar este usuario porque tiene ${hallazgos} hallazgo(s) asociado(s).`,
      );
    }

    return this.prisma.usuario.delete({ where: { id } });
  }
}