import { EventoDominio } from '../../domain/entities';
import { TipoEventoDominio } from '../../domain/enums';
import {
  EncargoRepository,
  EventoDominioRepository,
} from '../../domain/ports';

export class ExpirarEncargosUseCase {
  private static readonly MESES_EXPIRACION = 6;

  constructor(
    private readonly encargoRepo: EncargoRepository,
    private readonly eventoRepo: EventoDominioRepository,
  ) {}

  async ejecutar(): Promise<{ expirados: number; placas: string[] }> {
    const fechaLimite = new Date();
    fechaLimite.setMonth(
      fechaLimite.getMonth() - ExpirarEncargosUseCase.MESES_EXPIRACION,
    );

    const encargosVigentes =
      await this.encargoRepo.buscarVigentesAnterioresA(fechaLimite);

    const placasExpiradas: string[] = [];

    for (const encargo of encargosVigentes) {
      try {
        const cerrado = encargo.cerrar();
        await this.encargoRepo.actualizar(cerrado);

        const evento = EventoDominio.crear(
          TipoEventoDominio.ENCARGO_EXPIRADO,
          {
            encargoId: cerrado.id,
            placa: cerrado.placa,
            motivo: 'Expiración automática por antigüedad (6 meses)',
          },
        );
        await this.eventoRepo.guardar(evento);

        placasExpiradas.push(cerrado.placa);
      } catch (error) {
        console.error(
          `[ExpirarEncargos] Error al expirar encargo ${encargo.id}:`,
          error,
        );
      }
    }

    if (placasExpiradas.length > 0) {
      console.log(
        `[ExpirarEncargos] ${placasExpiradas.length} encargo(s) expirado(s): ${placasExpiradas.join(', ')}`,
      );
    }

    return { expirados: placasExpiradas.length, placas: placasExpiradas };
  }
}
