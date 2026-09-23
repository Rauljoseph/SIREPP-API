import { v4 as uuid } from 'uuid';
import { Notificacion } from '../../domain/entities';
import {
  ReunificacionRepository,
  EncargoRepository,
  NotificacionRepository,
  MailSenderPort,
} from '../../domain/ports';

export interface EnviarNotificacionInput {
  reunificacionId: string;
}

export class EnviarNotificacionReunificacionUseCase {
  constructor(
    private readonly reunificacionRepo: ReunificacionRepository,
    private readonly encargoRepo: EncargoRepository,
    private readonly notificacionRepo: NotificacionRepository,
    private readonly mailSender: MailSenderPort,
  ) {}

  async ejecutar(input: EnviarNotificacionInput): Promise<Notificacion> {
    const reunificacion = await this.reunificacionRepo.buscarPorId(input.reunificacionId);
    if (!reunificacion) {
      throw new Error(`Reunificación ${input.reunificacionId} no encontrada`);
    }

    const encargo = await this.encargoRepo.buscarPorId(reunificacion.encargoId);
    if (!encargo) {
      throw new Error(`Encargo ${reunificacion.encargoId} no encontrado`);
    }

    // Crear la notificación
    const notificacion = Notificacion.builder()
      .conId(uuid())
      .paraReunificacion(reunificacion.id)
      .conDestinatario(encargo.denuncianteEmail)
      .build();

    const guardada = await this.notificacionRepo.guardar(notificacion);

    // Intentar enviar
    try {
      const resultado = await this.mailSender.enviar({
        destinatario: encargo.denuncianteEmail,
        asunto: 'SIREPP — Su placa patente ha sido encontrada',
        cuerpo: this.componerCuerpo(encargo.placa, reunificacion.id),
      });

      const enviada = guardada.marcarEnviada(resultado.messageId);
      return this.notificacionRepo.actualizar(enviada);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      const fallida = guardada.marcarFallida(mensaje);
      return this.notificacionRepo.actualizar(fallida);
    }
  }

  private componerCuerpo(placa: string, reunificacionId: string): string {
    return [
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
    ].join('\n');
  }
}