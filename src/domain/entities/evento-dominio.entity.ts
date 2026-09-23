import { TipoEventoDominio } from '../enums';

export class EventoDominio {
  constructor(
    public readonly id: number | null,
    public readonly tipo: TipoEventoDominio,
    public readonly payload: Record<string, unknown>,
    public readonly procesado: boolean = false,
    public readonly createdAt: Date = new Date(),
  ) {}

  marcarProcesado(): EventoDominio {
    return new EventoDominio(
      this.id, this.tipo, this.payload, true, this.createdAt,
    );
  }

  static crear(tipo: TipoEventoDominio, payload: Record<string, unknown>): EventoDominio {
    return new EventoDominio(null, tipo, payload, false, new Date());
  }
}