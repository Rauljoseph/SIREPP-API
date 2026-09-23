import { v4 as uuid } from 'uuid';
import { Reunificacion, EventoDominio } from '../../domain/entities';
import { EstadoReunificacion, TipoEventoDominio } from '../../domain/enums';
import {
  EncargoRepository,
  HallazgoRepository,
  ReunificacionRepository,
  EventoDominioRepository,
} from '../../domain/ports';

export interface ConciliarDesdeEncargoInput {
  encargoId: string;
  placa: string;
}

export interface ConciliarDesdeHallazgoInput {
  hallazgoId: string;
  placa: string;
}

export interface ConciliacionResultado {
  reunificacion: Reunificacion | null;
  conciliada: boolean;
}

export class ConciliarPlacaUseCase {
  constructor(
    private readonly encargoRepo: EncargoRepository,
    private readonly hallazgoRepo: HallazgoRepository,
    private readonly reunificacionRepo: ReunificacionRepository,
    private readonly eventoRepo: EventoDominioRepository,
  ) {}

  async desdeEncargo(input: ConciliarDesdeEncargoInput): Promise<ConciliacionResultado> {
    const hallazgo = await this.hallazgoRepo.buscarSinReunificarPorPlaca(input.placa);
    if (!hallazgo) {
      return { reunificacion: null, conciliada: false };
    }

    return this.crearReunificacion(input.encargoId, hallazgo.id, input.placa);
  }

  async desdeHallazgo(input: ConciliarDesdeHallazgoInput): Promise<ConciliacionResultado> {
    const encargo = await this.encargoRepo.buscarVigentePorPlaca(input.placa);
    if (!encargo) {
      return { reunificacion: null, conciliada: false };
    }

    return this.crearReunificacion(encargo.id, input.hallazgoId, input.placa);
  }

  private async crearReunificacion(
    encargoId: string,
    hallazgoId: string,
    placa: string,
  ): Promise<ConciliacionResultado> {
    // Verificar que no exista ya una reunificación
    const existente = await this.reunificacionRepo.buscarPorEncargoId(encargoId);
    if (existente) {
      return { reunificacion: existente, conciliada: false };
    }

    const reunificacion = new Reunificacion(
      uuid(),
      encargoId,
      hallazgoId,
      EstadoReunificacion.PENDIENTE_RETIRO,
    );

    const guardada = await this.reunificacionRepo.guardar(reunificacion);

    // Actualizar estado del encargo
    const encargo = await this.encargoRepo.buscarPorId(encargoId);
    if (encargo) {
      const reunificado = encargo.reunificar();
      await this.encargoRepo.actualizar(reunificado);
    }

    // Evento de dominio
    const evento = EventoDominio.crear(TipoEventoDominio.PLACA_REUNIFICADA, {
      reunificacionId: guardada.id,
      encargoId,
      hallazgoId,
      placa,
    });
    await this.eventoRepo.guardar(evento);

    return { reunificacion: guardada, conciliada: true };
  }
}