import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { EventoDominioMapper } from './mappers/evento-dominio.mapper';
import { EventoDominio } from '../../domain/entities';
import { EventoDominioRepository } from '../../domain/ports';

@Injectable()
export class EventoDominioPrismaRepository implements EventoDominioRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: EventoDominioMapper,
  ) {}

  async guardar(evento: EventoDominio): Promise<EventoDominio> {
    const created = await this.prisma.eventoDominio.create({
      data: {
        tipo: evento.tipo,
        payload: evento.payload,
        procesado: evento.procesado,
      },
    });
    return this.mapper.toDomain(created);
  }

  async buscarNoProcesados(): Promise<EventoDominio[]> {
    const results = await this.prisma.eventoDominio.findMany({
      where: { procesado: false },
      orderBy: { createdAt: 'asc' },
    });
    return results.map((r) => this.mapper.toDomain(r));
  }

  async marcarProcesado(id: number): Promise<void> {
    await this.prisma.eventoDominio.update({
      where: { id },
      data: { procesado: true },
    });
  }
}