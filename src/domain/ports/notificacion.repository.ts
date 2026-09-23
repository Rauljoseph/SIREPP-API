import { Notificacion } from '../entities';

export interface NotificacionRepository {
  guardar(notificacion: Notificacion): Promise<Notificacion>;
  buscarPendientes(): Promise<Notificacion[]>;
  buscarFallidasReintentables(): Promise<Notificacion[]>;
  actualizar(notificacion: Notificacion): Promise<Notificacion>;
}

export const NOTIFICACION_REPOSITORY = Symbol('NotificacionRepository');