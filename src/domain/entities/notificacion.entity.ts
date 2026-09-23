import { TipoNotificacion, EstadoNotificacion } from '../enums';

export class Notificacion {
  private static readonly MAX_INTENTOS = 3;

  readonly id: string;
  readonly reunificacionId: string | null;
  readonly eventoLecturaId: string | null;
  readonly tipo: TipoNotificacion;
  readonly destinatarioEmail: string;
  readonly estado: EstadoNotificacion;
  readonly intentos: number;
  readonly ultimoIntentoAt: Date | null;
  readonly resultado: string | null;
  readonly messageId: string | null;
  readonly createdAt: Date;

  private constructor(builder: NotificacionBuilder) {
    this.id = builder.id;
    this.reunificacionId = builder.reunificacionId;
    this.eventoLecturaId = builder.eventoLecturaId;
    this.tipo = builder.tipo;
    this.destinatarioEmail = builder.destinatarioEmail;
    this.estado = builder.estado;
    this.intentos = builder.intentos;
    this.ultimoIntentoAt = builder.ultimoIntentoAt;
    this.resultado = builder.resultado;
    this.messageId = builder.messageId;
    this.createdAt = builder.createdAt;
  }

  static builder(): NotificacionBuilder {
    return new NotificacionBuilder();
  }

  puedeReintentarse(): boolean {
    return (
      this.estado !== EstadoNotificacion.ENVIADA &&
      this.intentos < Notificacion.MAX_INTENTOS
    );
  }

  marcarEnviada(messageId: string): Notificacion {
    return Notificacion.builder()
      .fromExisting(this)
      .conEstado(EstadoNotificacion.ENVIADA)
      .conIntento()
      .conMessageId(messageId)
      .conResultado('Enviado exitosamente')
      .build();
  }

  marcarFallida(error: string): Notificacion {
    const nuevoIntento = this.intentos + 1;
    const nuevoEstado = nuevoIntento >= Notificacion.MAX_INTENTOS
      ? EstadoNotificacion.FALLIDA
      : this.estado;

    return Notificacion.builder()
      .fromExisting(this)
      .conEstado(nuevoEstado)
      .conIntento()
      .conResultado(error)
      .build();
  }

  static fromBuilder(builder: NotificacionBuilder): Notificacion {
    return new Notificacion(builder);
  }
}

export class NotificacionBuilder {
  id: string = '';
  reunificacionId: string | null = null;
  eventoLecturaId: string | null = null;
  tipo: TipoNotificacion = TipoNotificacion.REUNIFICACION;
  destinatarioEmail: string = '';
  estado: EstadoNotificacion = EstadoNotificacion.PENDIENTE;
  intentos: number = 0;
  ultimoIntentoAt: Date | null = null;
  resultado: string | null = null;
  messageId: string | null = null;
  createdAt: Date = new Date();

  fromExisting(n: Notificacion): this {
    this.id = n.id;
    this.reunificacionId = n.reunificacionId;
    this.eventoLecturaId = n.eventoLecturaId;
    this.tipo = n.tipo;
    this.destinatarioEmail = n.destinatarioEmail;
    this.estado = n.estado;
    this.intentos = n.intentos;
    this.ultimoIntentoAt = n.ultimoIntentoAt;
    this.resultado = n.resultado;
    this.messageId = n.messageId;
    this.createdAt = n.createdAt;
    return this;
  }

  conId(id: string): this { this.id = id; return this; }

  paraReunificacion(reunificacionId: string): this {
    this.reunificacionId = reunificacionId;
    this.tipo = TipoNotificacion.REUNIFICACION;
    return this;
  }

  paraLectura(eventoLecturaId: string): this {
    this.eventoLecturaId = eventoLecturaId;
    this.tipo = TipoNotificacion.LECTURA_PORTICO;
    return this;
  }

  conDestinatario(email: string): this { this.destinatarioEmail = email; return this; }
  conEstado(estado: EstadoNotificacion): this { this.estado = estado; return this; }
  conMessageId(id: string): this { this.messageId = id; return this; }
  conResultado(resultado: string): this { this.resultado = resultado; return this; }

  conIntento(): this {
    this.intentos += 1;
    this.ultimoIntentoAt = new Date();
    return this;
  }

  build(): Notificacion {
    return Notificacion.fromBuilder(this);
  }
}