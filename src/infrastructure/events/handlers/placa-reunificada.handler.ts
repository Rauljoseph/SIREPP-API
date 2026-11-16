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
  ReunificacionRepository,
  REUNIFICACION_REPOSITORY,
} from '../../../domain/ports';
import { Notificacion } from '../../../domain/entities';

@Injectable()
export class PlacaReunificadaHandler implements EventoHandler {
  private readonly logger = new Logger(PlacaReunificadaHandler.name);

  constructor(
    @Inject(REUNIFICACION_REPOSITORY) private readonly reunificacionRepo: ReunificacionRepository,
    @Inject(ENCARGO_REPOSITORY) private readonly encargoRepo: EncargoRepository,
    @Inject(NOTIFICACION_REPOSITORY) private readonly notificacionRepo: NotificacionRepository,
    @Inject(MAIL_SENDER) private readonly mailSender: MailSenderPort,
  ) {}

  async handle(data: Record<string, unknown>): Promise<void> {
    const reunificacionId = data.reunificacionId as string;
    const placa = data.placa as string;

    const reunificacion = await this.reunificacionRepo.buscarPorId(reunificacionId);
    if (!reunificacion) {
      this.logger.warn(`Reunificación ${reunificacionId} no encontrada, omitiendo notificación`);
      return;
    }

    const encargo = await this.encargoRepo.buscarPorId(reunificacion.encargoId);
    if (!encargo) {
      this.logger.warn(`Encargo ${reunificacion.encargoId} no encontrado, omitiendo notificación`);
      return;
    }

    const notificacion = Notificacion.builder()
      .conId(uuid())
      .paraReunificacion(reunificacionId)
      .conDestinatario(encargo.denuncianteEmail)
      .build();

    const guardada = await this.notificacionRepo.guardar(notificacion);

    const resultado = await this.mailSender.enviar({
      destinatario: encargo.denuncianteEmail,
      asunto: 'SIREPP — Su placa patente ha sido encontrada',
      cuerpo: [
        `Estimado/a propietario/a:`,
        ``,
        `Le informamos que su placa patente ${placa} ha sido encontrada `,
        `y se encuentra disponible para retiro.`,
        ``,
        `Para retirarla, concurra a la unidad policial indicada portando:`,
        `- Cédula de identidad vigente`,
        `- Certificado de inscripción del vehículo`,
        ``,
        `Código de seguimiento: ${reunificacionId}`,
        ``,
        `SIREPP — Sistema Integrado de Registro y Reunificación de Placas Patente`,
      ].join('\n'),
    });

    const enviada = guardada.marcarEnviada(resultado.messageId);
    await this.notificacionRepo.actualizar(enviada);

    this.logger.log(`Notificación enviada a ${encargo.denuncianteEmail} por reunificación ${reunificacionId}`);
  }
}