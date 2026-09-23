import { Notificacion } from '../../domain/entities';
import {
  NotificacionRepository,
  MailSenderPort,
} from '../../domain/ports';

export class ReintentarNotificacionesUseCase {
  constructor(
    private readonly notificacionRepo: NotificacionRepository,
    private readonly mailSender: MailSenderPort,
  ) {}

  async ejecutar(): Promise<{ exitosas: number; fallidas: number }> {
    const pendientes = await this.notificacionRepo.buscarFallidasReintentables();
    let exitosas = 0;
    let fallidas = 0;

    for (const notificacion of pendientes) {
      if (!notificacion.puedeReintentarse()) {
        continue;
      }

      try {
        const resultado = await this.mailSender.enviar({
          destinatario: notificacion.destinatarioEmail,
          asunto: 'SIREPP — Su placa patente ha sido encontrada',
          cuerpo: 'Reintento de notificación. Contacte a su unidad policial más cercana.',
        });

        const enviada = notificacion.marcarEnviada(resultado.messageId);
        await this.notificacionRepo.actualizar(enviada);
        exitosas++;
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        const fallida = notificacion.marcarFallida(mensaje);
        await this.notificacionRepo.actualizar(fallida);
        fallidas++;
      }
    }

    return { exitosas, fallidas };
  }
}