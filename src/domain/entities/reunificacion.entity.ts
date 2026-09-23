import { EstadoReunificacion } from '../enums';

export class Reunificacion {
  constructor(
    public readonly id: string,
    public readonly encargoId: string,
    public readonly hallazgoId: string,
    public readonly estado: EstadoReunificacion = EstadoReunificacion.PENDIENTE_RETIRO,
    public readonly fechaConciliacion: Date = new Date(),
    public readonly fechaEntrega: Date | null = null,
    public readonly funcionarioEntregaId: string | null = null,
    public readonly receptorRut: string | null = null,
    public readonly receptorNombre: string | null = null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  estaPendiente(): boolean {
    return this.estado === EstadoReunificacion.PENDIENTE_RETIRO;
  }

  puedeEntregarse(): boolean {
    return this.estado === EstadoReunificacion.PENDIENTE_RETIRO;
  }

  entregar(funcionarioId: string, receptorRut: string, receptorNombre: string): Reunificacion {
    if (!this.puedeEntregarse()) {
      throw new Error(`Reunificación ${this.id} no puede entregarse en estado ${this.estado}`);
    }
    return new Reunificacion(
      this.id,
      this.encargoId,
      this.hallazgoId,
      EstadoReunificacion.ENTREGADA,
      this.fechaConciliacion,
      new Date(),
      funcionarioId,
      receptorRut,
      receptorNombre,
      this.createdAt,
      new Date(),
    );
  }
}