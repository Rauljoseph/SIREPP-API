import { Injectable } from '@nestjs/common';
import { Usuario as PrismaUsuario } from '@prisma/client';
import { Usuario } from '../../../domain/entities';
import { Rol } from '../../../domain/enums';

@Injectable()
export class UsuarioMapper {
  toDomain(prisma: PrismaUsuario): Usuario {
    return new Usuario(
      prisma.id,
      prisma.keycloakSub,
      prisma.nombreCompleto,
      prisma.email,
      prisma.rol as Rol,
      prisma.unidadId,
      prisma.servicioActivo,
      prisma.ultimoAcceso ?? undefined,
      prisma.createdAt,
      prisma.updatedAt,
    );
  }
}