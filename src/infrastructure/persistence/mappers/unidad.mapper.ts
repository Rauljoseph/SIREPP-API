import { Injectable } from '@nestjs/common';
import { Unidad as PrismaUnidad } from '@prisma/client';
import { Unidad } from '../../../domain/entities';
import { TipoUnidad } from '../../../domain/enums';

@Injectable()
export class UnidadMapper {
  toDomain(prisma: PrismaUnidad): Unidad {
    return new Unidad(
      prisma.id,
      prisma.nombre,
      prisma.tipo as TipoUnidad,
      prisma.direccion,
      prisma.region,
      prisma.comuna,
      prisma.activa,
      prisma.horarioAtencion ?? undefined,
      prisma.telefono ?? undefined,
      prisma.createdAt,
      prisma.updatedAt,
    );
  }
}