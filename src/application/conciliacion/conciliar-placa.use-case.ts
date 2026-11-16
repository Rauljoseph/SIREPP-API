import { v4 as uuid } from 'uuid';
import { Reunificacion, EventoDominio } from '../../domain/entities';
import { EstadoReunificacion, TipoEventoDominio, EstadoPlacaPublica } from '../../domain/enums';
import {
  EncargoRepository,
  HallazgoRepository,
  ReunificacionRepository,
  EventoDominioRepository,
  EventPublisherPort,
} from '../../domain/ports';
import { PublicarPlacaPublicaUseCase } from '../placa-publica/publicar-placa-publica.use-case';

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
    private readonly eventPublisher: EventPublisherPort,
    private readonly publicarPlaca: PublicarPlacaPublicaUseCase, // ← NUEVO
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

    // Publicar evento a la cola
    try {
      await this.eventPublisher.publicar(TipoEventoDominio.PLACA_REUNIFICADA, {
        reunificacionId: guardada.id,
        encargoId,
        hallazgoId,
        placa,
      });
    } catch (error) {
      console.error('Error publicando evento PLACA_REUNIFICADA:', (error as Error).message);
    }

    // ══ NUEVO: Publicar a tabla pública con estado DISPONIBLE_PARA_RETIRO ══
    try {
      const hallazgo = await this.hallazgoRepo.buscarPorId(hallazgoId);
      await this.publicarPlaca.ejecutar({
        placa,
        estado: EstadoPlacaPublica.DISPONIBLE_PARA_RETIRO,
        unidadId: hallazgo?.unidadId ?? encargo?.unidadId ?? '',
        fechaIngreso: new Date(),
      });
    } catch (error) {
      console.error('Error publicando placa a tabla pública:', (error as Error).message);
    }

    return { reunificacion: guardada, conciliada: true };
  }
}