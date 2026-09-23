import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { HallazgoMapper } from './mappers/hallazgo.mapper';
import { Hallazgo } from '../../domain/entities';
import { HallazgoRepository } from '../../domain/ports';

@Injectable()
export class HallazgoPrismaRepository implements HallazgoRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: HallazgoMapper,
  ) {}

  async guardar(hallazgo: Hallazgo): Promise<Hallazgo> {
    const data = this.mapper.toPrisma(hallazgo);
    const created = await this.prisma.hallazgo.create({ data: data as any });
    return this.mapper.toDomain(created);
  }

  async buscarPorId(id: string): Promise<Hallazgo | null> {
    const found = await this.prisma.hallazgo.findUnique({ where: { id } });
    return found ? this.mapper.toDomain(found) : null;
  }

  async buscarPorPlaca(placa: string): Promise<Hallazgo[]> {
    const results = await this.prisma.hallazgo.findMany({
      where: { placa: placa.toUpperCase() },
      orderBy: { createdAt: 'desc' },
    });
    return results.map((r) => this.mapper.toDomain(r));
  }

  async buscarSinReunificarPorPlaca(placa: string): Promise<Hallazgo | null> {
    const found = await this.prisma.hallazgo.findFirst({
      where: {
        placa: placa.toUpperCase(),
        reunificacion: null, // sin reunificación asociada
      },
    });
    return found ? this.mapper.toDomain(found) : null;
  }
}