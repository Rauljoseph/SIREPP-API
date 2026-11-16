import { Injectable } from '@nestjs/common';
import { PlacaPublica as PrismaPlacaPublica } from '@prisma/client';
import { PlacaPublica } from '../../../domain/entities';
import { EstadoPlacaPublica } from '../../../domain/enums';

@Injectable()
export class PlacaPublicaMapper {
  toDomain(prisma: PrismaPlacaPublica): PlacaPublica {
    return PlacaPublica.builder()
      .conId(prisma.id)
      .conPlaca(prisma.placa)
      .conEstado(prisma.estado as EstadoPlacaPublica)
      .conUnidad(
        prisma.unidadNombre,
        prisma.unidadDireccion,
        prisma.unidadComuna,
        prisma.unidadRegion,
      )
      .conCoordenadas(prisma.unidadLatitud, prisma.unidadLongitud)
      .conHorario(prisma.horarioAtencion)
      .conTelefono(prisma.telefonoUnidad)
      .conRequisitos(prisma.requisitosRetiro ?? '')
      .conFechaIngreso(prisma.fechaIngreso)
      .conFechas(prisma.fechaPublicacion, prisma.updatedAt)
      .build();
  }

  toPrisma(entity: PlacaPublica) {
    return {
      id: entity.id,
      placa: entity.placa,
      estado: entity.estado,
      unidadNombre: entity.unidadNombre,
      unidadDireccion: entity.unidadDireccion,
      unidadComuna: entity.unidadComuna,
      unidadRegion: entity.unidadRegion,
      unidadLatitud: entity.unidadLatitud,
      unidadLongitud: entity.unidadLongitud,
      horarioAtencion: entity.horarioAtencion,
      telefonoUnidad: entity.telefonoUnidad,
      requisitosRetiro: entity.requisitosRetiro,
      fechaIngreso: entity.fechaIngreso,
    };
  }
}