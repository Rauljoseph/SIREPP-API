import { Usuario } from '../entities';

export interface UsuarioRepository {
  buscarPorId(id: string): Promise<Usuario | null>;
  //una vez esté el login hay que buscar con este
  buscarPorKeycloakSub(sub: string): Promise<Usuario | null>;
}

export const USUARIO_REPOSITORY = Symbol('UsuarioRepository');