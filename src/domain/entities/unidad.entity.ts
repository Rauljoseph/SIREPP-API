import { TipoUnidad } from '../enums';

export class Unidad {
  constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly tipo: TipoUnidad,
    public readonly direccion: string,
    public readonly region: string,
    public readonly comuna: string,
    public readonly activa: boolean = true,
    public readonly horarioAtencion?: string,
    public readonly telefono?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  estaActiva(): boolean {
    return this.activa;
  }

  descripcionCompleta(): string {
    return `${this.nombre} — ${this.direccion}, ${this.comuna}, ${this.region}`;
  }
}