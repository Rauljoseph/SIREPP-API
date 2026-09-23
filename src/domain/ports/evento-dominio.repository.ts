import { EventoDominio } from '../entities';

export interface EventoDominioRepository {
  guardar(evento: EventoDominio): Promise<EventoDominio>;
  buscarNoProcesados(): Promise<EventoDominio[]>;
  marcarProcesado(id: number): Promise<void>;
}

export const EVENTO_DOMINIO_REPOSITORY = Symbol('EventoDominioRepository');