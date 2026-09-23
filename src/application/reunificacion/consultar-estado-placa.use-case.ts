import { Encargo, Hallazgo, Reunificacion } from '../../domain/entities';
import {
  EncargoRepository,
  HallazgoRepository,
  ReunificacionRepository,
} from '../../domain/ports';

export interface EstadoPlaca {
  placa: string;
  encargo: Encargo | null;
  hallazgos: Hallazgo[];
  reunificacion: Reunificacion | null;
  resumen: string;
}

export class ConsultarEstadoPlacaUseCase {
  constructor(
    private readonly encargoRepo: EncargoRepository,
    private readonly hallazgoRepo: HallazgoRepository,
    private readonly reunificacionRepo: ReunificacionRepository,
  ) {}

  async ejecutar(placa: string): Promise<EstadoPlaca> {
    const normalizada = placa.toUpperCase().replace(/\s/g, '');

    const encargo = await this.encargoRepo.buscarVigentePorPlaca(normalizada);
    const hallazgos = await this.hallazgoRepo.buscarPorPlaca(normalizada);

    let reunificacion: Reunificacion | null = null;
    if (encargo) {
      reunificacion = await this.reunificacionRepo.buscarPorEncargoId(encargo.id);
    }

    const resumen = this.generarResumen(encargo, hallazgos, reunificacion);

    return {
      placa: normalizada,
      encargo,
      hallazgos,
      reunificacion,
      resumen,
    };
  }

  private generarResumen(
    encargo: Encargo | null,
    hallazgos: Hallazgo[],
    reunificacion: Reunificacion | null,
  ): string {
    if (!encargo) {
      return 'Sin encargo vigente';
    }

    if (reunificacion?.estado === 'ENTREGADA') {
      return 'Caso cerrado — placa entregada al propietario';
    }

    if (reunificacion?.estado === 'PENDIENTE_RETIRO') {
      return 'Placa encontrada — pendiente de retiro por el propietario';
    }

    if (hallazgos.length > 0) {
      return 'Encargo vigente — hallazgo registrado, pendiente de conciliación';
    }

    return `Encargo vigente desde ${encargo.createdAt.toLocaleDateString('es-CL')}`;
  }
}