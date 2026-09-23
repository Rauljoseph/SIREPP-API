import { Hallazgo } from '../entities';

export interface HallazgoRepository {
  guardar(hallazgo: Hallazgo): Promise<Hallazgo>;
  buscarPorId(id: string): Promise<Hallazgo | null>;
  buscarPorPlaca(placa: string): Promise<Hallazgo[]>;
  buscarSinReunificarPorPlaca(placa: string): Promise<Hallazgo | null>;
}

export const HALLAZGO_REPOSITORY = Symbol('HallazgoRepository');