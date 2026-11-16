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
export class EncargoAnuladoHandler implements EventoHandler {
  private readonly logger = new Logger(EncargoAnuladoHandler.name);

  constructor(
    @Inject(ENCARGO_REPOSITORY) private readonly encargoRepo: EncargoRepository,
    @Inject(NOTIFICACION_REPOSITORY) private readonly notificacionRepo: NotificacionRepository,
    @Inject(MAIL_SENDER) private readonly mailSender: MailSenderPort,
  ) {}

  async handle(data: Record<string, unknown>): Promise<void> {
    const encargoId = data.encargoId as string;
    const placa = data.placa as string;
    const motivo = data.motivo as string;

    const encargo = await this.encargoRepo.buscarPorId(encargoId);
    if (!encargo) {
      this.logger.warn(`Encargo ${encargoId} no encontrado para notificación de anulación`);
      return;
    }

    const notificacion = Notificacion.builder()
      .conId(uuid())
      .paraAnulacion()
      .conDestinatario(encargo.denuncianteEmail)
      .build();

    const guardada = await this.notificacionRepo.guardar(notificacion);

    const resultado = await this.mailSender.enviar({
      destinatario: encargo.denuncianteEmail,
      asunto: 'SIREPP — Su encargo de placa patente ha sido anulado',
      cuerpo: [
        `Estimado/a propietario/a:`,
        ``,
        `Le informamos que el encargo de búsqueda para su placa patente ${placa} `,
        `ha sido anulado.`,
        ``,
        `Motivo: ${motivo}`,
        ``,
        `Si usted no solicitó esta anulación o considera que es un error, `,
        `le invitamos a acercarse a la unidad policial más cercana para `,
        `presentar un nuevo encargo.`,
        ``,
        `SIREPP — Sistema Integrado de Registro y Reunificación de Placas Patente`,
      ].join('\n'),
    });

    const enviada = guardada.marcarEnviada(resultado.messageId);
    await this.notificacionRepo.actualizar(enviada);

    this.logger.log(`Notificación de anulación enviada a ${encargo.denuncianteEmail} — encargo ${encargoId}`);
  }
}