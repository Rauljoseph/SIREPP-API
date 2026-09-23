export class EventoLectura {
  private static readonly UMBRAL_CONFIANZA_DEFAULT = 0.75;

  constructor(
    public readonly id: string,
    public readonly placa: string,
    public readonly portico: string,
    public readonly nivelConfianza: number,
    public readonly encargoId: string,
    public readonly notificado: boolean = false,
    public readonly timestampLectura: Date = new Date(),
    public readonly createdAt: Date = new Date(),
  ) {}

  superaUmbral(umbral: number = EventoLectura.UMBRAL_CONFIANZA_DEFAULT): boolean {
    return this.nivelConfianza >= umbral;
  }

  marcarNotificado(): EventoLectura {
    return new EventoLectura(
      this.id, this.placa, this.portico, this.nivelConfianza,
      this.encargoId, true, this.timestampLectura, this.createdAt,
    );
  }
}