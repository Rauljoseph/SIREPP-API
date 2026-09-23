export class PlacaReunificadaEvent {
  constructor(
    public readonly reunificacionId: string,
    public readonly encargoId: string,
    public readonly hallazgoId: string,
    public readonly placa: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}