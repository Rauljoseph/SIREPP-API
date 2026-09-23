import { Injectable } from '@nestjs/common';
import { EventoLectura as PrismaEventoLectura } from '@prisma/client';
import { EventoLectura } from '../../../domain/entities';

@Injectable()
export class EventoLecturaMapper {
  toDomain(prisma: PrismaEventoLectura): EventoLectura {
    return new EventoLectura(
      prisma.id,
      prisma.placa,
      prisma.portico,
      prisma.nivelConfianza,
      prisma.encargoId,
      prisma.notificado,
      prisma.timestampLectura,
      prisma.createdAt,
    );
  }

  toPrisma(entity: EventoLectura): Record<string, unknown> {
    return {
      id: entity.id,
      placa: entity.placa,
      portico: entity.portico,
      nivelConfianza: entity.nivelConfianza,
      encargoId: entity.encargoId,
      notificado: entity.notificado,
      timestampLectura: entity.timestampLectura,
    };
  }
}