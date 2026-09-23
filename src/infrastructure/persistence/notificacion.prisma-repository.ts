import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { NotificacionMapper } from './mappers/notificacion.mapper';
import { Notificacion } from '../../domain/entities';
import { NotificacionRepository } from '../../domain/ports';
import { EstadoNotificacion } from '../../domain/enums';

@Injectable()
export class NotificacionPrismaRepository implements NotificacionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: NotificacionMapper,
  ) {}

  async guardar(notificacion: Notificacion): Promise<Notificacion> {
    const data = this.mapper.toPrisma(notificacion);
    const created = await this.prisma.notificacion.create({ data: data as any });
    return this.mapper.toDomain(created);
  }

  async buscarPendientes(): Promise<Notificacion[]> {
    const results = await this.prisma.notificacion.findMany({
      where: { estado: EstadoNotificacion.PENDIENTE },
      orderBy: { createdAt: 'asc' },
    });
    return results.map((r) => this.mapper.toDomain(r));
  }

  async buscarFallidasReintentables(): Promise<Notificacion[]> {
    const results = await this.prisma.notificacion.findMany({
      where: {
        estado: { not: EstadoNotificacion.ENVIADA },
        intentos: { lt: 3 },
      },
      orderBy: { createdAt: 'asc' },
    });
    return results.map((r) => this.mapper.toDomain(r));
  }

  async actualizar(notificacion: Notificacion): Promise<Notificacion> {
    const data = this.mapper.toPrisma(notificacion);
    const { id, ...rest } = data as any;
    const updated = await this.prisma.notificacion.update({
      where: { id: notificacion.id },
      data: rest,
    });
    return this.mapper.toDomain(updated);
  }
}