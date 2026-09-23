import { v4 as uuid } from 'uuid';
import { EventoLectura, Notificacion, EventoDominio } from '../../domain/entities';
import { TipoEventoDominio } from '../../domain/enums';
import {
  EncargoRepository,
  EventoLecturaRepository,
  NotificacionRepository,
  EventoDominioRepository,
  MailSenderPort,
} from '../../domain/ports';

export interface ProcesarLecturaInput {
  placa: string;
  portico: string;
  nivelConfianza: number;
  timestampLectura: Date;
}

export interface ProcesarLecturaOutput {
  registrada: boolean;
  notificada: boolean;
  motivo?: string;
}

export class ProcesarLecturaUseCase {
  private readonly UMBRAL_CONFIANZA = 0.75;

  constructor(
    private readonly encargoRepo: EncargoRepository,
    private readonly eventoLecturaRepo: EventoLecturaRepository,
    private readonly notificacionRepo: NotificacionRepository,
    private readonly eventoRepo: EventoDominioRepository,
    private readonly mailSender: MailSenderPort,
  ) {}

  async ejecutar(input: ProcesarLecturaInput): Promise<ProcesarLecturaOutput> {
    // Buscar encargo vigente
    const encargo = await this.encargoRepo.buscarVigentePorPlaca(input.placa);
    if (!encargo) {
      return { registrada: false, notificada: false, motivo: 'Sin encargo vigente' };
    }

    // Registrar el evento de lectura
    const eventoLectura = new EventoLectura(
      uuid(),
      input.placa,
      input.portico,
      input.nivelConfianza,
      encargo.id,
      false,
      input.timestampLectura,
    );

    const guardado = await this.eventoLecturaRepo.guardar(eventoLectura);

    // Evento de dominio
    const eventoDominio = EventoDominio.crear(TipoEventoDominio.PLACA_LEIDA, {
      eventoLecturaId: guardado.id,
      placa: input.placa,
      portico: input.portico,
      nivelConfianza: input.nivelConfianza,
      encargoId: encargo.id,
    });
    await this.eventoRepo.guardar(eventoDominio);

    // Verificar umbral antes de notificar
    if (!guardado.superaUmbral(this.UMBRAL_CONFIANZA)) {
      return {
        registrada: true,
        notificada: false,
        motivo: `Confianza ${input.nivelConfianza} bajo umbral ${this.UMBRAL_CONFIANZA}`,
      };
    }

    // Notificar al propietario (como indicio, no como certeza)
    try {
      const notificacion = Notificacion.builder()
        .conId(uuid())
        .paraLectura(guardado.id)
        .conDestinatario(encargo.denuncianteEmail)
        .build();

      const notifGuardada = await this.notificacionRepo.guardar(notificacion);

      const resultado = await this.mailSender.enviar({
        destinatario: encargo.denuncianteEmail,
        asunto: 'SIREPP — Posible avistamiento de su placa patente',
        cuerpo: this.componerCuerpo(input.placa, input.portico, input.timestampLectura),
      });

      const enviada = notifGuardada.marcarEnviada(resultado.messageId);
      await this.notificacionRepo.actualizar(enviada);

      return { registrada: true, notificada: true };
    } catch {
      return { registrada: true, notificada: false, motivo: 'Error al enviar notificación' };
    }
  }

  private componerCuerpo(placa: string, portico: string, timestamp: Date): string {
    return [
      `Estimado/a propietario/a:`,
      ``,
      `Le informamos que una placa con caracteres similares a ${placa} `,
      `fue registrada por un sistema de lectura automática.`,
      ``,
      `Punto de lectura: ${portico}`,
      `Fecha y hora: ${timestamp.toLocaleString('es-CL')}`,
      ``,
      `IMPORTANTE: Esta información corresponde a un indicio generado `,
      `por un sistema automático de reconocimiento y no constituye `,
      `una confirmación. La lectura puede contener errores.`,
      ``,
      `SIREPP — Sistema Integrado de Registro y Reunificación de Placas Patente`,
    ].join('\n');
  }
}