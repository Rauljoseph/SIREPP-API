import { EstadoFisico } from '../enums';

export class Hallazgo {
  constructor(
    public readonly id: string,
    public readonly placa: string,
    public readonly estadoFisico: EstadoFisico,
    public readonly unidadId: string,
    public readonly funcionarioId: string,
    public readonly observaciones: string | null = null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  estaEnBuenEstado(): boolean {
    return this.estadoFisico === EstadoFisico.BUENO;
  }

  esLegible(): boolean {
    return this.estadoFisico !== EstadoFisico.ILEGIBLE;
  }
}