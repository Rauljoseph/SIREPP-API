import { v4 as uuid } from 'uuid';
import { Notificacion } from '../../domain/entities';
import {
  ReunificacionRepository,
  EncargoRepository,
  NotificacionRepository,
  MailSenderPort,
  HallazgoRepository,
  UnidadRepository,
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
    private readonly hallazgoRepo: HallazgoRepository,
    private readonly unidadRepo: UnidadRepository,
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

    // Buscar hallazgo y unidad de custodia
    const hallazgo = await this.hallazgoRepo.buscarPorId(reunificacion.hallazgoId);
    let datosUnidad = '';
    if (hallazgo) {
      const unidad = await this.unidadRepo.buscarPorId(hallazgo.unidadId);
      if (unidad) {
        datosUnidad = unidad.descripcionCompleta();
        if (unidad.horarioAtencion) datosUnidad += '\nHorario de atención: ' + unidad.horarioAtencion;
        if (unidad.telefono) datosUnidad += '\nTeléfono: ' + unidad.telefono;
      }
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
        cuerpo: this.componerCuerpo(encargo.placa, reunificacion.id, datosUnidad),
      });

      const enviada = guardada.marcarEnviada(resultado.messageId);
      return this.notificacionRepo.actualizar(enviada);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      const fallida = guardada.marcarFallida(mensaje);
      return this.notificacionRepo.actualizar(fallida);
    }
  }

  private componerCuerpo(placa: string, reunificacionId: string, datosUnidad: string): string {
    const lines = [
      'Estimado/a propietario/a:',
      '',
      'Le informamos que su placa patente ' + placa + ' ha sido encontrada y se encuentra disponible para retiro.',
      '',
    ];

    if (datosUnidad) {
      lines.push('Lugar de retiro:');
      lines.push(datosUnidad);
    } else {
      lines.push('Contacte a Carabineros para conocer el lugar de retiro.');
    }

    lines.push('');
    lines.push('Para retirarla, debe presentar:');
    lines.push('- Cédula de identidad vigente');
    lines.push('- Certificado de inscripción del vehículo');
    lines.push('');
    lines.push('Código de seguimiento: ' + reunificacionId);
    lines.push('');
    lines.push('SIREPP — Sistema Integrado de Registro y Reunificación de Placas Patente');

    return lines.join('\n');
  }
}