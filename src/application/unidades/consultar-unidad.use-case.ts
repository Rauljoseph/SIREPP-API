import { Unidad } from '../../domain/entities';
import { UnidadRepository } from '../../domain/ports';

export class ConsultarUnidadUseCase {
  constructor(
    private readonly unidadRepo: UnidadRepository,
  ) {}

  async porId(id: string): Promise<Unidad | null> {
    return this.unidadRepo.buscarPorId(id);
  }
}