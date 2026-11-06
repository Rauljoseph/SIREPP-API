import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { UsuarioMapper } from './mappers/usuario.mapper';
import { Usuario } from '../../domain/entities';
import { UsuarioRepository } from '../../domain/ports';

@Injectable()
export class UsuarioPrismaRepository implements UsuarioRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UsuarioMapper,
  ) {}

  async buscarPorId(id: string): Promise<Usuario | null> {
    const found = await this.prisma.usuario.findUnique({ where: { id } });
    return found ? this.mapper.toDomain(found) : null;
  }

  async buscarPorKeycloakSub(sub: string): Promise<Usuario | null> {
    const found = await this.prisma.usuario.findUnique({
      where: { keycloakSub: sub },
    });
    return found ? this.mapper.toDomain(found) : null;
  }
}