export class AuditLog {
  constructor(
    public readonly id: number | null,
    public readonly usuarioId: string,
    public readonly accion: string,
    public readonly entidad: string,
    public readonly entidadId: string | null,
    public readonly detalle: Record<string, unknown> | null,
    public readonly ip: string,
    public readonly userAgent: string | null = null,
    public readonly createdAt: Date = new Date(),
  ) {}

  static crear(params: {
    usuarioId: string;
    accion: string;
    entidad: string;
    entidadId?: string;
    detalle?: Record<string, unknown>;
    ip: string;
    userAgent?: string;
  }): AuditLog {
    return new AuditLog(
      null, params.usuarioId, params.accion, params.entidad,
      params.entidadId ?? null, params.detalle ?? null,
      params.ip, params.userAgent ?? null,
    );
  }
}