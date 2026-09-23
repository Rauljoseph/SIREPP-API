import { Encargo } from '../../domain/entities';
import { EncargoRepository } from '../../domain/ports';
import { EncargoNoEncontradoException } from '../../domain/exceptions';

export class ConsultarEncargoUseCase {
  constructor(
    private readonly encargoRepo: EncargoRepository,
  ) {}

  async porId(id: string): Promise<Encargo> {
    const encargo = await this.encargoRepo.buscarPorId(id);
    if (!encargo) {
      throw new EncargoNoEncontradoException(id);
    }
    return encargo;
  }

  async porPlaca(placa: string): Promise<Encargo[]> {
    return this.encargoRepo.buscarPorPlaca(placa);
  }

  async vigentePorPlaca(placa: string): Promise<Encargo | null> {
    return this.encargoRepo.buscarVigentePorPlaca(placa);
  }
}