export class PlacaEncargadaEvent {
  constructor(
    public readonly encargoId: string,
    public readonly placa: string,
    public readonly unidadId: string,
    public readonly funcionarioId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}