import { Rol } from '../enums';

export class Usuario {
  constructor(
    public readonly id: string,
    public readonly keycloakSub: string,
    public readonly nombreCompleto: string,
    public readonly email: string,
    public readonly rol: Rol,
    public readonly unidadId: string,
    public readonly servicioActivo: boolean = true,
    public readonly ultimoAcceso?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  estaEnServicio(): boolean {
    return this.servicioActivo;
  }

  tieneRol(rol: Rol): boolean {
    return this.rol === rol;
  }

  puedeRegistrar(): boolean {
    return this.servicioActivo && this.rol === Rol.GUARDIA;
  }

  puedeAnular(): boolean {
    return this.servicioActivo && this.rol === Rol.SUPERVISOR;
  }

  puedeConsultar(): boolean {
    return this.servicioActivo;
  }

  puedeAdministrar(): boolean {
    return this.servicioActivo && this.rol === Rol.ADMINISTRADOR;
  }
}