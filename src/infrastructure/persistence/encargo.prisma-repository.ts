import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { EncargoMapper } from './mappers/encargo.mapper';
import { Encargo } from '../../domain/entities';
import { EncargoRepository } from '../../domain/ports';
import { EstadoEncargo } from '../../domain/enums';

@Injectable()
export class EncargoPrismaRepository implements EncargoRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: EncargoMapper,
  ) {}

  async guardar(encargo: Encargo): Promise<Encargo> {
    const data = this.mapper.toPrisma(encargo);
    const created = await this.prisma.encargo.create({ data: data as any });
    return this.mapper.toDomain(created);
  }

  async buscarPorId(id: string): Promise<Encargo | null> {
    const found = await this.prisma.encargo.findUnique({ where: { id } });
    return found ? this.mapper.toDomain(found) : null;
  }

  async buscarPorPlaca(placa: string): Promise<Encargo[]> {
    const results = await this.prisma.encargo.findMany({
      where: { placa: placa.toUpperCase() },
      orderBy: { createdAt: 'desc' },
    });
    return results.map((r) => this.mapper.toDomain(r));
  }

  async buscarVigentePorPlaca(placa: string): Promise<Encargo | null> {
    const found = await this.prisma.encargo.findFirst({
      where: {
        placa: placa.toUpperCase(),
        estado: EstadoEncargo.VIGENTE,
      },
    });
    return found ? this.mapper.toDomain(found) : null;
  }

  async actualizar(encargo: Encargo): Promise<Encargo> {
    const data = this.mapper.toPrisma(encargo);
    const { id, ...rest } = data as any;
    const updated = await this.prisma.encargo.update({
      where: { id: encargo.id },
      data: rest,
    });
    return this.mapper.toDomain(updated);
  }

  async buscarVigentesAnterioresA(fecha: Date): Promise<Encargo[]> {
    const records = await this.prisma.encargo.findMany({
      where: {
        estado: 'VIGENTE',
        createdAt: { lt: fecha },
      },
    });
    return records.map((r) => this.mapper.toDomain(r));
  }
}