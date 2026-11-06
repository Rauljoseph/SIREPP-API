import { Encargo } from '../entities';

export interface EncargoRepository {
  guardar(encargo: Encargo): Promise<Encargo>;
  buscarPorId(id: string): Promise<Encargo | null>;
  buscarPorPlaca(placa: string): Promise<Encargo[]>;
  buscarVigentePorPlaca(placa: string): Promise<Encargo | null>;
  actualizar(encargo: Encargo): Promise<Encargo>;
  buscarVigentesAnterioresA(fecha: Date): Promise<Encargo[]>;
}

export const ENCARGO_REPOSITORY = Symbol('EncargoRepository');