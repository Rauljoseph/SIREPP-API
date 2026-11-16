import { PlacaPublica } from '../entities';

export interface PlacaPublicaRepository {
  guardar(placaPublica: PlacaPublica): Promise<PlacaPublica>;
  actualizar(placaPublica: PlacaPublica): Promise<PlacaPublica>;
  buscarPorPlaca(placa: string): Promise<PlacaPublica | null>;
  listarPorEstado(estado?: string): Promise<PlacaPublica[]>;
}

export const PLACA_PUBLICA_REPOSITORY = Symbol('PlacaPublicaRepository');