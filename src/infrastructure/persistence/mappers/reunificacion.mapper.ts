import { Injectable } from '@nestjs/common';
import { Reunificacion as PrismaReunificacion } from '@prisma/client';
import { Reunificacion } from '../../../domain/entities';
import { EstadoReunificacion } from '../../../domain/enums';
import { AesCipherService } from '../../crypto/aes-cipher.service';

@Injectable()
export class ReunificacionMapper {
  constructor(private readonly cipher: AesCipherService) {}

  toDomain(prisma: PrismaReunificacion): Reunificacion {
    return new Reunificacion(
      prisma.id,
      prisma.encargoId,
      prisma.hallazgoId,
      prisma.estado as EstadoReunificacion,
      prisma.fechaConciliacion,
      prisma.fechaEntrega,
      prisma.funcionarioEntregaId,
      prisma.receptorRutCifrado ? this.cipher.descifrar(prisma.receptorRutCifrado) : null,
      prisma.receptorNombreCifrado ? this.cipher.descifrar(prisma.receptorNombreCifrado) : null,
      prisma.createdAt,
      prisma.updatedAt,
    );
  }

  toPrisma(entity: Reunificacion): Record<string, unknown> {
    return {
      id: entity.id,
      encargoId: entity.encargoId,
      hallazgoId: entity.hallazgoId,
      estado: entity.estado,
      fechaConciliacion: entity.fechaConciliacion,
      fechaEntrega: entity.fechaEntrega,
      funcionarioEntregaId: entity.funcionarioEntregaId,
      receptorRutCifrado: entity.receptorRut ? this.cipher.cifrar(entity.receptorRut) : null,
      receptorNombreCifrado: entity.receptorNombre ? this.cipher.cifrar(entity.receptorNombre) : null,
    };
  }
}