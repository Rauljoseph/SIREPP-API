import { Hallazgo } from '../../domain/entities';
import { HallazgoRepository } from '../../domain/ports';
import { HallazgoNoEncontradoException } from '../../domain/exceptions';

export class ConsultarHallazgoUseCase {
  constructor(
    private readonly hallazgoRepo: HallazgoRepository,
  ) {}

  async porId(id: string): Promise<Hallazgo> {
    const hallazgo = await this.hallazgoRepo.buscarPorId(id);
    if (!hallazgo) {
      throw new HallazgoNoEncontradoException(id);
    }
    return hallazgo;
  }

  async porPlaca(placa: string): Promise<Hallazgo[]> {
    return this.hallazgoRepo.buscarPorPlaca(placa);
  }
}