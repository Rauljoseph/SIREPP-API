import { Injectable } from '@nestjs/common';
import { Encargo as PrismaEncargo } from '@prisma/client';
import { Encargo } from '../../../domain/entities';
import { TipoEvento, EstadoEncargo } from '../../../domain/enums';
import { AesCipherService } from '../../crypto/aes-cipher.service';

@Injectable()
export class EncargoMapper {
  constructor(private readonly cipher: AesCipherService) {}

  toDomain(prisma: PrismaEncargo): Encargo {
    return Encargo.builder()
      .conId(prisma.id)
      .conPlaca(prisma.placa)
      .conTipoEvento(prisma.tipoEvento as TipoEvento)
      .conEstado(prisma.estado as EstadoEncargo)
      .conDenunciante(
        this.cipher.descifrar(prisma.denuncianteRutCifrado),
        this.cipher.descifrar(prisma.denuncianteNombreCifrado),
        this.cipher.descifrar(prisma.denuncianteEmailCifrado),
      )
      .conCanalNotificacion(prisma.canalNotificacion)
      .conFechaHecho(prisma.fechaHecho)
      .conUnidad(prisma.unidadId)
      .conFuncionario(prisma.funcionarioId)
      .conFechas(prisma.createdAt, prisma.updatedAt)
      .build();
  }

  toPrisma(entity: Encargo): Record<string, unknown> {
    return {
      id: entity.id,
      placa: entity.placa,
      tipoEvento: entity.tipoEvento,
      estado: entity.estado,
      denuncianteRutCifrado: this.cipher.cifrar(entity.denuncianteRut),
      denuncianteNombreCifrado: this.cipher.cifrar(entity.denuncianteNombre),
      denuncianteEmailCifrado: this.cipher.cifrar(entity.denuncianteEmail),
      canalNotificacion: entity.canalNotificacion,
      constanciaNumero: entity.constanciaNumero,
      fechaHecho: entity.fechaHecho,
      observaciones: entity.observaciones,
      unidadId: entity.unidadId,
      funcionarioId: entity.funcionarioId,
      anuladoPor: entity.anuladoPor,
      motivoAnulacion: entity.motivoAnulacion,
    };
  }
}