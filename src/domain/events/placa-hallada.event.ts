export class PlacaHalladaEvent {
  constructor(
    public readonly hallazgoId: string,
    public readonly placa: string,
    public readonly unidadId: string,
    public readonly funcionarioId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}