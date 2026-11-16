import { Injectable } from '@nestjs/common';
import { PlacaPublica } from '../../domain/entities';
import { PlacaPublicaRepository } from '../../domain/ports';
import { PrismaService } from './prisma/prisma.service';
import { PlacaPublicaMapper } from './mappers/placa-publica.mapper';

@Injectable()
export class PlacaPublicaPrismaRepository implements PlacaPublicaRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: PlacaPublicaMapper,
  ) {}

  async guardar(placa: PlacaPublica): Promise<PlacaPublica> {
    const data = this.mapper.toPrisma(placa);
    const result = await this.prisma.placaPublica.upsert({
      where: { placa: data.placa },
      update: data,
      create: data,
    });
    return this.mapper.toDomain(result);
  }

  async actualizar(placa: PlacaPublica): Promise<PlacaPublica> {
    const data = this.mapper.toPrisma(placa);
    const result = await this.prisma.placaPublica.update({
      where: { id: placa.id },
      data,
    });
    return this.mapper.toDomain(result);
  }

  async buscarPorPlaca(placa: string): Promise<PlacaPublica | null> {
    const normalizada = placa.toUpperCase().replace(/[\s.-]/g, '');
    const result = await this.prisma.placaPublica.findUnique({
      where: { placa: normalizada },
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async listarPorEstado(estado?: string): Promise<PlacaPublica[]> {
    const where = estado ? { estado: estado as any } : {};
    const results = await this.prisma.placaPublica.findMany({
      where,
      orderBy: { fechaPublicacion: 'desc' },
      take: 100,
    });
    return results.map((r) => this.mapper.toDomain(r));
  }
}