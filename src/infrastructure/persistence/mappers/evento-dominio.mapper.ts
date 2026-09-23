import { Injectable } from '@nestjs/common';
import { EventoDominio as PrismaEventoDominio } from '@prisma/client';
import { EventoDominio } from '../../../domain/entities';
import { TipoEventoDominio } from '../../../domain/enums';

@Injectable()
export class EventoDominioMapper {
  toDomain(prisma: PrismaEventoDominio): EventoDominio {
    return new EventoDominio(
      prisma.id,
      prisma.tipo as TipoEventoDominio,
      prisma.payload as Record<string, unknown>,
      prisma.procesado,
      prisma.createdAt,
    );
  }
}