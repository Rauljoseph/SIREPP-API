import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { EventoLecturaMapper } from './mappers/evento-lectura.mapper';
import { EventoLectura } from '../../domain/entities';
import { EventoLecturaRepository } from '../../domain/ports';

@Injectable()
export class EventoLecturaPrismaRepository implements EventoLecturaRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: EventoLecturaMapper,
  ) {}

  async guardar(evento: EventoLectura): Promise<EventoLectura> {
    const data = this.mapper.toPrisma(evento);
    const created = await this.prisma.eventoLectura.create({ data: data as any });
    return this.mapper.toDomain(created);
  }

  async buscarPorEncargoId(encargoId: string): Promise<EventoLectura[]> {
    const results = await this.prisma.eventoLectura.findMany({
      where: { encargoId },
      orderBy: { timestampLectura: 'desc' },
    });
    return results.map((r) => this.mapper.toDomain(r));
  }
}