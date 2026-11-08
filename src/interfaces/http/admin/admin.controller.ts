import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { CrearUnidadDto } from './dto/crear-unidad.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { Funcionario, type FuncionarioAutenticado } from '../../../shared/auth/funcionario.decorator';
import { KeycloakAdminService } from './keycloak-admin.service';

@ApiTags('Administración')
@Controller('api/admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly keycloak: KeycloakAdminService,
  ) {}

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
  async crearUsuario(@Body() dto: CrearUsuarioDto, @Funcionario() funcionario: FuncionarioAutenticado) {
    this.exigirAdministrador(funcionario);
    const email = dto.email.trim().toLowerCase();
    const duplicados = await this.prisma.$queryRaw<{ existe: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM "usuario" WHERE LOWER(BTRIM("email")) = ${email}) AS existe
    `;
    if (duplicados[0]?.existe) {
      throw new ConflictException('Este correo electrónico ya está vinculado a una cuenta.');
    }
    const unidad = await this.prisma.unidad.findUnique({ where: { id: dto.unidadId } });
    if (!unidad?.activa) throw new BadRequestException('Selecciona una unidad activa.');

    const keycloakSub = await this.keycloak.crearCuenta(email, dto.nombreCompleto);
    const usuario = await this.guardarUsuario(dto, email, keycloakSub);
    try {
      await this.keycloak.enviarInvitacion(keycloakSub);
    } catch {
      this.logger.warn(`No se pudo confirmar el envío de la invitación para ${usuario.id}.`);
      return { ...usuario, invitacionEnviada: false };
    }
    return { ...usuario, invitacionEnviada: true };
  }

  private async guardarUsuario(dto: CrearUsuarioDto, email: string, keycloakSub: string) {
    try {
      return await this.prisma.usuario.create({
        data: { ...dto, email, keycloakSub },
        include: { unidad: true },
      });
    } catch (error) {
      // Confirm that no local record uses this identity before compensating a failed write.
      const vinculado = await this.prisma.usuario.findUnique({ where: { keycloakSub } });
      if (!vinculado) await this.keycloak.eliminarCuenta(keycloakSub);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Este correo electrónico ya está vinculado a una cuenta.');
      }
      throw error;
    }
  }

  @Post('usuarios/:id/invitacion')
  async reenviarInvitacion(@Param('id') id: string, @Funcionario() funcionario: FuncionarioAutenticado) {
    this.exigirAdministrador(funcionario);
    const usuario = await this.prisma.usuario.findUnique({ where: { id }, include: { unidad: true } });
    if (!usuario) throw new NotFoundException('No se encontró al funcionario.');
    if (!usuario.servicioActivo || !usuario.unidad.activa || usuario.keycloakSub.startsWith('local-')) {
      throw new ConflictException('El funcionario debe tener una cuenta vinculada y activa.');
    }
    await this.keycloak.enviarInvitacion(usuario.keycloakSub);
    return { invitacionEnviada: true };
  }

  private exigirAdministrador(funcionario: FuncionarioAutenticado) {
    if (funcionario.rol !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Solo un administrador puede gestionar invitaciones.');
    }
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
