import { Reunificacion } from '../entities';

export interface ReunificacionRepository {
  guardar(reunificacion: Reunificacion): Promise<Reunificacion>;
  buscarPorId(id: string): Promise<Reunificacion | null>;
  buscarPorEncargoId(encargoId: string): Promise<Reunificacion | null>;
  actualizar(reunificacion: Reunificacion): Promise<Reunificacion>;
}

export const REUNIFICACION_REPOSITORY = Symbol('ReunificacionRepository');