import { Encargo } from '../entities';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EncargoRepository {
  guardar(encargo: Encargo): Promise<Encargo>;
  buscarPorId(id: string): Promise<Encargo | null>;
  buscarPorPlaca(placa: string): Promise<Encargo[]>;
  buscarVigentePorPlaca(placa: string): Promise<Encargo | null>;
  actualizar(encargo: Encargo): Promise<Encargo>;
  buscarVigentesAnterioresA(fecha: Date): Promise<Encargo[]>;
  listarPorEstado(estado?: string, page?: number, limit?: number): Promise<PaginatedResult<Encargo>>;
}

export const ENCARGO_REPOSITORY = Symbol('EncargoRepository');