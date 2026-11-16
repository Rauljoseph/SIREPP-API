import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { EventoHandler } from './evento-handler.interface';
import {
  EncargoRepository,
  ENCARGO_REPOSITORY,
  NotificacionRepository,
  NOTIFICACION_REPOSITORY,
  MailSenderPort,
  MAIL_SENDER,
} from '../../../domain/ports';
import { Notificacion } from '../../../domain/entities';

@Injectable()
export class PlacaLeidaHandler implements EventoHandler {
  private readonly logger = new Logger(PlacaLeidaHandler.name);

  constructor(
    @Inject(ENCARGO_REPOSITORY) private readonly encargoRepo: EncargoRepository,
    @Inject(NOTIFICACION_REPOSITORY) private readonly notificacionRepo: NotificacionRepository,
    @Inject(MAIL_SENDER) private readonly mailSender: MailSenderPort,
  ) {}

  async handle(data: Record<string, unknown>): Promise<void> {
    const notificar = data.notificar as boolean;
    if (!notificar) {
      this.logger.log(`Lectura de placa ${data.placa} bajo umbral — sin notificación`);
      return;
    }

    const encargoId = data.encargoId as string;
    const encargo = await this.encargoRepo.buscarPorId(encargoId);
    if (!encargo) {
      this.logger.warn(`Encargo ${encargoId} no encontrado para notificación de lectura`);
      return;
    }

    const eventoLecturaId = data.eventoLecturaId as string;

    const notificacion = Notificacion.builder()
      .conId(uuid())
      .paraLectura(eventoLecturaId)
      .conDestinatario(encargo.denuncianteEmail)
      .build();

    const guardada = await this.notificacionRepo.guardar(notificacion);

    const resultado = await this.mailSender.enviar({
      destinatario: encargo.denuncianteEmail,
      asunto: 'SIREPP — Posible avistamiento de su placa patente',
      cuerpo: [
        `Estimado/a propietario/a:`,
        ``,
        `Le informamos que una placa con caracteres similares a ${data.placa} `,
        `fue registrada por un sistema de lectura automática.`,
        ``,
        `Punto de lectura: ${data.portico}`,
        `Fecha y hora: ${data.timestampLectura}`,
        ``,
        `IMPORTANTE: Esta información corresponde a un indicio generado `,
        `por un sistema automático de reconocimiento y no constituye `,
        `una confirmación. La lectura puede contener errores.`,
        ``,
        `SIREPP — Sistema Integrado de Registro y Reunificación de Placas Patente`,
      ].join('\n'),
    });

    const enviada = guardada.marcarEnviada(resultado.messageId);
    await this.notificacionRepo.actualizar(enviada);

    this.logger.log(`Notificación de lectura enviada a ${encargo.denuncianteEmail}`);
  }
}