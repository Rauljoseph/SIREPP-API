import { Injectable } from '@nestjs/common';
import { Notificacion as PrismaNotificacion } from '@prisma/client';
import { Notificacion } from '../../../domain/entities';
import { TipoNotificacion, EstadoNotificacion } from '../../../domain/enums';
import { AesCipherService } from '../../crypto/aes-cipher.service';

@Injectable()
export class NotificacionMapper {
  constructor(private readonly cipher: AesCipherService) {}

  toDomain(prisma: PrismaNotificacion): Notificacion {
    return Notificacion.builder()
      .conId(prisma.id)
      .conDestinatario(this.cipher.descifrar(prisma.destinatarioEmailCifrado))
      .conEstado(prisma.estado as EstadoNotificacion)
      .build();
  }

  toPrisma(entity: Notificacion): Record<string, unknown> {
    return {
      id: entity.id,
      reunificacionId: entity.reunificacionId,
      eventoLecturaId: entity.eventoLecturaId,
      tipo: entity.tipo,
      destinatarioEmailCifrado: this.cipher.cifrar(entity.destinatarioEmail),
      estado: entity.estado,
      intentos: entity.intentos,
      ultimoIntentoAt: entity.ultimoIntentoAt,
      resultado: entity.resultado,
      messageId: entity.messageId,
    };
  }
}