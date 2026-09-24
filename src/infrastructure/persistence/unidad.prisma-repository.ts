import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { UnidadMapper } from './mappers/unidad.mapper';
import { Unidad } from '../../domain/entities';
import { UnidadRepository } from '../../domain/ports';

@Injectable()
export class UnidadPrismaRepository implements UnidadRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UnidadMapper,
  ) {}

  async buscarPorId(id: string): Promise<Unidad | null> {
    const found = await this.prisma.unidad.findUnique({ where: { id } });
    return found ? this.mapper.toDomain(found) : null;
  }
}