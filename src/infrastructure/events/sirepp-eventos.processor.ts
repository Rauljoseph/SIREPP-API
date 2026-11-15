import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TipoEventoDominio } from '../../domain/enums';
import {
  EncargoRepository,
  ENCARGO_REPOSITORY,
  NotificacionRepository,
  NOTIFICACION_REPOSITORY,
  MailSenderPort,
  MAIL_SENDER,
  ReunificacionRepository,
  REUNIFICACION_REPOSITORY,
} from '../../domain/ports';
import { Notificacion } from '../../domain/entities';
import { v4 as uuid } from 'uuid';

@Processor('sirepp-eventos')
export class SireppEventosProcessor extends WorkerHost {
  private readonly logger = new Logger(SireppEventosProcessor.name);

  constructor(
    @Inject(REUNIFICACION_REPOSITORY) private readonly reunificacionRepo: ReunificacionRepository,
    @Inject(ENCARGO_REPOSITORY) private readonly encargoRepo: EncargoRepository,
    @Inject(NOTIFICACION_REPOSITORY) private readonly notificacionRepo: NotificacionRepository,
    @Inject(MAIL_SENDER) private readonly mailSender: MailSenderPort,
  ) {
    super();
  }

  async process(job: Job<Record<string, unknown>>): Promise<void> {
    const tipo = job.name as TipoEventoDominio;
    this.logger.log(`Procesando evento: ${tipo} (job ${job.id})`);

    switch (tipo) {
      case TipoEventoDominio.PLACA_REUNIFICADA:
        await this.onPlacaReunificada(job.data);
        break;

      case TipoEventoDominio.PLACA_LEIDA:
        await this.onPlacaLeida(job.data);
        break;

      case TipoEventoDominio.PLACA_ENCARGADA:
        this.logger.log(`Placa ${job.data.placa} encargada — encargo ${job.data.encargoId}`);
        break;

      case TipoEventoDominio.PLACA_HALLADA:
        this.logger.log(`Placa ${job.data.placa} hallada — hallazgo ${job.data.hallazgoId}`);
        break;

      case TipoEventoDominio.ENCARGO_ANULADO:
        this.logger.log(`Encargo ${job.data.encargoId} anulado — motivo: ${job.data.motivo}`);
        break;

      case TipoEventoDominio.CASO_CERRADO:
        this.logger.log(`Caso cerrado — reunificación ${job.data.reunificacionId}`);
        break;

      default:
        this.logger.warn(`Tipo de evento no manejado: ${tipo}`);
    }
  }

  private async onPlacaReunificada(data: Record<string, unknown>): Promise<void> {
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

  private async onPlacaLeida(data: Record<string, unknown>): Promise<void> {
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