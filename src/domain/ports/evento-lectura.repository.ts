import { EventoLectura } from '../entities';

export interface EventoLecturaRepository {
  guardar(evento: EventoLectura): Promise<EventoLectura>;
  buscarPorEncargoId(encargoId: string): Promise<EventoLectura[]>;
}

export const EVENTO_LECTURA_REPOSITORY = Symbol('EventoLecturaRepository');