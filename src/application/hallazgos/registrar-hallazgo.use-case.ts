import { v4 as uuid } from 'uuid';
import { Hallazgo, EventoDominio } from '../../domain/entities';
import { EstadoFisico, TipoEventoDominio } from '../../domain/enums';
import {
  HallazgoRepository,
  EventoDominioRepository,
  EventPublisherPort,
} from '../../domain/ports';
import { ConciliarPlacaUseCase } from '../conciliacion/conciliar-placa.use-case';

export interface RegistrarHallazgoInput {
  placa: string;
  estadoFisico: EstadoFisico;
  observaciones?: string;
  unidadId: string;
  funcionarioId: string;
}

export interface RegistrarHallazgoOutput {
  hallazgo: Hallazgo;
  conciliacion: {
    reunificacionId: string;
    mensaje: string;
  } | null;
}

export class RegistrarHallazgoUseCase {
  constructor(
    private readonly hallazgoRepo: HallazgoRepository,
    private readonly eventoRepo: EventoDominioRepository,
    private readonly conciliar: ConciliarPlacaUseCase,
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async ejecutar(input: RegistrarHallazgoInput): Promise<RegistrarHallazgoOutput> {
    // 1. Crear y persistir el hallazgo
    const hallazgo = new Hallazgo(
      uuid(),
      input.placa.toUpperCase().replace(/\s/g, ''),
      input.estadoFisico,
      input.unidadId,
      input.funcionarioId,
      input.observaciones ?? null,
    );

    const guardado = await this.hallazgoRepo.guardar(hallazgo);

    // 2. Registrar evento de dominio
    const evento = EventoDominio.crear(TipoEventoDominio.PLACA_HALLADA, {
      hallazgoId: guardado.id,
      placa: guardado.placa,
      unidadId: guardado.unidadId,
      funcionarioId: guardado.funcionarioId,
    });
    await this.eventoRepo.guardar(evento);

    // 3. Publicar evento a la cola (observadores reaccionan de forma asíncrona)
    try {
      await this.eventPublisher.publicar(TipoEventoDominio.PLACA_HALLADA, {
        hallazgoId: guardado.id,
        placa: guardado.placa,
        unidadId: guardado.unidadId,
        funcionarioId: guardado.funcionarioId,
      });
    } catch (error) {
      console.error('Error publicando evento PLACA_HALLADA:', (error as Error).message);
    }

    const conciliacion = await this.intentarConciliacion(guardado);

    return {
      hallazgo: guardado,
      conciliacion,
    };
  }

  private async intentarConciliacion(
    hallazgo: Hallazgo,
  ): Promise<RegistrarHallazgoOutput['conciliacion']> {
    try {
      const resultado = await this.conciliar.desdeHallazgo({
        hallazgoId: hallazgo.id,
        placa: hallazgo.placa,
      });

      if (!resultado?.conciliada || !resultado?.reunificacion) {
        return null;
      }

      // ── La notificación por email ahora la maneja el processor de BullMQ ──
      // ── al recibir el evento PLACA_REUNIFICADA (patrón Observer) ──

      return {
        reunificacionId: resultado.reunificacion.id,
        mensaje: 'Se encontró un encargo vigente. La placa fue reunificada automáticamente.',
      };
    } catch (error) {
      console.error('Error en conciliación automática:', (error as Error).message);
      return null;
    }
  }
}