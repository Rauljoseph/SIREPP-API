import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ReunificacionMapper } from './mappers/reunificacion.mapper';
import { Reunificacion } from '../../domain/entities';
import { ReunificacionRepository } from '../../domain/ports';

@Injectable()
export class ReunificacionPrismaRepository implements ReunificacionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: ReunificacionMapper,
  ) {}

  async guardar(reunificacion: Reunificacion): Promise<Reunificacion> {
    const data = this.mapper.toPrisma(reunificacion);
    const created = await this.prisma.reunificacion.create({ data: data as any });
    return this.mapper.toDomain(created);
  }

  async buscarPorId(id: string): Promise<Reunificacion | null> {
    const found = await this.prisma.reunificacion.findUnique({ where: { id } });
    return found ? this.mapper.toDomain(found) : null;
  }

  async buscarPorEncargoId(encargoId: string): Promise<Reunificacion | null> {
    const found = await this.prisma.reunificacion.findUnique({
      where: { encargoId },
    });
    return found ? this.mapper.toDomain(found) : null;
  }

  async actualizar(reunificacion: Reunificacion): Promise<Reunificacion> {
    const data = this.mapper.toPrisma(reunificacion);
    const { id, ...rest } = data as any;
    const updated = await this.prisma.reunificacion.update({
      where: { id: reunificacion.id },
      data: rest,
    });
    return this.mapper.toDomain(updated);
  }
}