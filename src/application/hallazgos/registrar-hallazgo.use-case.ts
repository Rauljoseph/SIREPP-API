import { v4 as uuid } from 'uuid';
import { Hallazgo, EventoDominio } from '../../domain/entities';
import { EstadoFisico, TipoEventoDominio } from '../../domain/enums';
import {
  HallazgoRepository,
  EventoDominioRepository,
} from '../../domain/ports';

export interface RegistrarHallazgoInput {
  placa: string;
  estadoFisico: EstadoFisico;
  observaciones?: string;
  unidadId: string;
  funcionarioId: string;
}

export class RegistrarHallazgoUseCase {
  constructor(
    private readonly hallazgoRepo: HallazgoRepository,
    private readonly eventoRepo: EventoDominioRepository,
  ) {}

  async ejecutar(input: RegistrarHallazgoInput): Promise<Hallazgo> {
    const hallazgo = new Hallazgo(
      uuid(),
      input.placa.toUpperCase().replace(/\s/g, ''),
      input.estadoFisico,
      input.unidadId,
      input.funcionarioId,
      input.observaciones ?? null,
    );

    const guardado = await this.hallazgoRepo.guardar(hallazgo);

    const evento = EventoDominio.crear(TipoEventoDominio.PLACA_HALLADA, {
      hallazgoId: guardado.id,
      placa: guardado.placa,
      unidadId: guardado.unidadId,
      funcionarioId: guardado.funcionarioId,
    });
    await this.eventoRepo.guardar(evento);

    return guardado;
  }
}