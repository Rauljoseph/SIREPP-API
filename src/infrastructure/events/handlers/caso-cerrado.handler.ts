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
export class CasoCerradoHandler implements EventoHandler {
  private readonly logger = new Logger(CasoCerradoHandler.name);

  constructor(
    @Inject(ENCARGO_REPOSITORY) private readonly encargoRepo: EncargoRepository,
    @Inject(NOTIFICACION_REPOSITORY) private readonly notificacionRepo: NotificacionRepository,
    @Inject(MAIL_SENDER) private readonly mailSender: MailSenderPort,
  ) {}

  async handle(data: Record<string, unknown>): Promise<void> {
    const reunificacionId = data.reunificacionId as string;
    const encargoId = data.encargoId as string;

    const encargo = await this.encargoRepo.buscarPorId(encargoId);
    if (!encargo) {
      this.logger.warn(`Encargo ${encargoId} no encontrado para notificación de entrega`);
      return;
    }

    const notificacion = Notificacion.builder()
      .conId(uuid())
      .paraEntrega()
      .conDestinatario(encargo.denuncianteEmail)
      .build();

    const guardada = await this.notificacionRepo.guardar(notificacion);

    const resultado = await this.mailSender.enviar({
      destinatario: encargo.denuncianteEmail,
      asunto: 'SIREPP — Su placa patente ha sido entregada exitosamente',
      cuerpo: [
        `Estimado/a propietario/a:`,
        ``,
        `Le confirmamos que su placa patente ${encargo.placa} ha sido `,
        `entregada exitosamente. El caso ha sido cerrado.`,
        ``,
        `Código de seguimiento: ${reunificacionId}`,
        ``,
        `Agradecemos su colaboración con el sistema. Si en el futuro `,
        `requiere registrar un nuevo encargo, no dude en acercarse a `,
        `la unidad policial más cercana.`,
        ``,
        `SIREPP — Sistema Integrado de Registro y Reunificación de Placas Patente`,
      ].join('\n'),
    });

    const enviada = guardada.marcarEnviada(resultado.messageId);
    await this.notificacionRepo.actualizar(enviada);

    this.logger.log(`Notificación de entrega enviada a ${encargo.denuncianteEmail} — reunificación ${reunificacionId}`);
  }
}