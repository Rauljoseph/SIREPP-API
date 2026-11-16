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
export class EncargoExpiradoHandler implements EventoHandler {
  private readonly logger = new Logger(EncargoExpiradoHandler.name);

  constructor(
    @Inject(ENCARGO_REPOSITORY) private readonly encargoRepo: EncargoRepository,
    @Inject(NOTIFICACION_REPOSITORY) private readonly notificacionRepo: NotificacionRepository,
    @Inject(MAIL_SENDER) private readonly mailSender: MailSenderPort,
  ) {}

  async handle(data: Record<string, unknown>): Promise<void> {
    const encargoId = data.encargoId as string;
    const placa = data.placa as string;

    const encargo = await this.encargoRepo.buscarPorId(encargoId);
    if (!encargo) {
      this.logger.warn(`Encargo ${encargoId} no encontrado para notificación de expiración`);
      return;
    }

    const notificacion = Notificacion.builder()
      .conId(uuid())
      .paraExpiracion()
      .conDestinatario(encargo.denuncianteEmail)
      .build();

    const guardada = await this.notificacionRepo.guardar(notificacion);

    const resultado = await this.mailSender.enviar({
      destinatario: encargo.denuncianteEmail,
      asunto: 'SIREPP — Su encargo de placa patente ha expirado',
      cuerpo: [
        `Estimado/a propietario/a:`,
        ``,
        `Le informamos que el encargo de búsqueda para su placa patente ${placa} `,
        `ha expirado después de 6 meses sin resultados positivos.`,
        ``,
        `El encargo ha sido cerrado automáticamente conforme al plazo `,
        `establecido por el sistema.`,
        ``,
        `Si desea continuar con la búsqueda, puede registrar un nuevo `,
        `encargo acercándose a la unidad policial más cercana.`,
        ``,
        `SIREPP — Sistema Integrado de Registro y Reunificación de Placas Patente`,
      ].join('\n'),
    });

    const enviada = guardada.marcarEnviada(resultado.messageId);
    await this.notificacionRepo.actualizar(enviada);

    this.logger.log(`Notificación de expiración enviada a ${encargo.denuncianteEmail} — encargo ${encargoId}`);
  }
}