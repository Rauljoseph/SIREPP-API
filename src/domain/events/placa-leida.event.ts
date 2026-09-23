export class PlacaLeidaEvent {
  constructor(
    public readonly eventoLecturaId: string,
    public readonly placa: string,
    public readonly portico: string,
    public readonly nivelConfianza: number,
    public readonly encargoId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}