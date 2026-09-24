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

    // Buscar TODOS los encargos de esta placa, no solo el vigente
    const encargos = await this.encargoRepo.buscarPorPlaca(normalizada);
    const hallazgos = await this.hallazgoRepo.buscarPorPlaca(normalizada);

    // El encargo más relevante: primero vigente, luego reunificado, luego el más reciente
    const encargo = this.seleccionarEncargo(encargos);

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

  private seleccionarEncargo(encargos: Encargo[]): Encargo | null {
    if (encargos.length === 0) return null;

    // Prioridad: VIGENTE > REUNIFICADO > CERRADO > otros
    const prioridad = ['VIGENTE', 'REUNIFICADO', 'CERRADO'];

    for (const estado of prioridad) {
      const encontrado = encargos.find((e) => e.estado === estado);
      if (encontrado) return encontrado;
    }

    // Si no hay ninguno con esos estados, devolver el más reciente
    return encargos[0];
  }

  private generarResumen(
    encargo: Encargo | null,
    hallazgos: Hallazgo[],
    reunificacion: Reunificacion | null,
  ): string {
    if (!encargo) {
      if (hallazgos.length > 0) {
        return 'Placa encontrada — sin encargo asociado, en custodia';
      }
      return 'Sin registros para esta placa';
    }

    if (encargo.estado === 'CERRADO' && reunificacion?.estado === 'ENTREGADA') {
      return 'Caso cerrado — placa entregada al propietario';
    }

    if (encargo.estado === 'REUNIFICADO' && reunificacion?.estado === 'PENDIENTE_RETIRO') {
      return 'Placa encontrada — pendiente de retiro por el propietario';
    }

    if (encargo.estado === 'ANULADO') {
      return 'Encargo anulado';
    }

    if (encargo.estado === 'VIGENTE' && hallazgos.length > 0) {
      return 'Encargo vigente — hallazgo registrado, pendiente de conciliación';
    }

    if (encargo.estado === 'VIGENTE') {
      return `Encargo vigente desde ${encargo.createdAt.toLocaleDateString('es-CL')}`;
    }

    return `Estado: ${encargo.estado}`;
  }
}