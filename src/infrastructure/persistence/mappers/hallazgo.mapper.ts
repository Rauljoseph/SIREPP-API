import { Injectable } from '@nestjs/common';
import { Hallazgo as PrismaHallazgo } from '@prisma/client';
import { Hallazgo } from '../../../domain/entities';
import { EstadoFisico } from '../../../domain/enums';

@Injectable()
export class HallazgoMapper {
  toDomain(prisma: PrismaHallazgo): Hallazgo {
    return new Hallazgo(
      prisma.id,
      prisma.placa,
      prisma.estadoFisico as EstadoFisico,
      prisma.unidadId,
      prisma.funcionarioId,
      prisma.observaciones,
      prisma.createdAt,
      prisma.updatedAt,
    );
  }

  toPrisma(entity: Hallazgo): Record<string, unknown> {
    return {
      id: entity.id,
      placa: entity.placa,
      estadoFisico: entity.estadoFisico,
      observaciones: entity.observaciones,
      unidadId: entity.unidadId,
      funcionarioId: entity.funcionarioId,
    };
  }
}