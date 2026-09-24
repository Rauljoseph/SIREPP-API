import { Unidad } from '../entities';

export interface UnidadRepository {
  buscarPorId(id: string): Promise<Unidad | null>;
}

export const UNIDAD_REPOSITORY = Symbol('UnidadRepository');