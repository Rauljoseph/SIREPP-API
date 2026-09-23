import { TipoEvento, EstadoEncargo } from '../enums';
import { PlacaInvalidaException } from '../exceptions';

export class Encargo {
  readonly id: string;
  readonly placa: string;
  readonly tipoEvento: TipoEvento;
  readonly estado: EstadoEncargo;
  readonly denuncianteRut: string;
  readonly denuncianteNombre: string;
  readonly denuncianteEmail: string;
  readonly canalNotificacion: string;
  readonly constanciaNumero: string | null;
  readonly fechaHecho: Date;
  readonly observaciones: string | null;
  readonly unidadId: string;
  readonly funcionarioId: string;
  readonly anuladoPor: string | null;
  readonly motivoAnulacion: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(builder: EncargoBuilder) {
    this.id = builder.id;
    this.placa = builder.placa;
    this.tipoEvento = builder.tipoEvento;
    this.estado = builder.estado;
    this.denuncianteRut = builder.denuncianteRut;
    this.denuncianteNombre = builder.denuncianteNombre;
    this.denuncianteEmail = builder.denuncianteEmail;
    this.canalNotificacion = builder.canalNotificacion;
    this.constanciaNumero = builder.constanciaNumero;
    this.fechaHecho = builder.fechaHecho;
    this.observaciones = builder.observaciones;
    this.unidadId = builder.unidadId;
    this.funcionarioId = builder.funcionarioId;
    this.anuladoPor = builder.anuladoPor;
    this.motivoAnulacion = builder.motivoAnulacion;
    this.createdAt = builder.createdAt;
    this.updatedAt = builder.updatedAt;
  }

  static builder(): EncargoBuilder {
    return new EncargoBuilder();
  }

  estaVigente(): boolean {
    return this.estado === EstadoEncargo.VIGENTE;
  }

  puedeAnularse(): boolean {
    return this.estado === EstadoEncargo.VIGENTE;
  }

  puedeReunificarse(): boolean {
    return this.estado === EstadoEncargo.VIGENTE;
  }

  puedeCerrarse(): boolean {
    return this.estado === EstadoEncargo.REUNIFICADO;
  }

  reunificar(): Encargo {
    if (!this.puedeReunificarse()) {
      throw new Error(`Encargo ${this.id} no puede reunificarse en estado ${this.estado}`);
    }
    return Encargo.builder()
      .fromExisting(this)
      .conEstado(EstadoEncargo.REUNIFICADO)
      .build();
  }

  cerrar(): Encargo {
    if (!this.puedeCerrarse()) {
      throw new Error(`Encargo ${this.id} no puede cerrarse en estado ${this.estado}`);
    }
    return Encargo.builder()
      .fromExisting(this)
      .conEstado(EstadoEncargo.CERRADO)
      .build();
  }

  anular(supervisorId: string, motivo: string): Encargo {
    if (!this.puedeAnularse()) {
      throw new Error(`Encargo ${this.id} no puede anularse en estado ${this.estado}`);
    }
    return Encargo.builder()
      .fromExisting(this)
      .conEstado(EstadoEncargo.ANULADO)
      .conAnulacion(supervisorId, motivo)
      .build();
  }

  static validarPlaca(placa: string): boolean {
    // Formato chileno: BBBB-12, BB-BB-12, o variantes
    const patron = /^[A-Z]{2,4}[-]?\d{2,4}$/;
    return patron.test(placa.toUpperCase().replace(/\s/g, ''));
  }

  // ── Builder ──────────────────────────────────────────────

  static fromBuilder(builder: EncargoBuilder): Encargo {
    return new Encargo(builder);
  }
}

export class EncargoBuilder {
  id: string = '';
  placa: string = '';
  tipoEvento: TipoEvento = TipoEvento.EXTRAVIO;
  estado: EstadoEncargo = EstadoEncargo.VIGENTE;
  denuncianteRut: string = '';
  denuncianteNombre: string = '';
  denuncianteEmail: string = '';
  canalNotificacion: string = 'EMAIL';
  constanciaNumero: string | null = null;
  fechaHecho: Date = new Date();
  observaciones: string | null = null;
  unidadId: string = '';
  funcionarioId: string = '';
  anuladoPor: string | null = null;
  motivoAnulacion: string | null = null;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();

  fromExisting(encargo: Encargo): this {
    this.id = encargo.id;
    this.placa = encargo.placa;
    this.tipoEvento = encargo.tipoEvento;
    this.estado = encargo.estado;
    this.denuncianteRut = encargo.denuncianteRut;
    this.denuncianteNombre = encargo.denuncianteNombre;
    this.denuncianteEmail = encargo.denuncianteEmail;
    this.canalNotificacion = encargo.canalNotificacion;
    this.constanciaNumero = encargo.constanciaNumero;
    this.fechaHecho = encargo.fechaHecho;
    this.observaciones = encargo.observaciones;
    this.unidadId = encargo.unidadId;
    this.funcionarioId = encargo.funcionarioId;
    this.anuladoPor = encargo.anuladoPor;
    this.motivoAnulacion = encargo.motivoAnulacion;
    this.createdAt = encargo.createdAt;
    this.updatedAt = new Date();
    return this;
  }

  conId(id: string): this {
    this.id = id;
    return this;
  }

  conPlaca(placa: string): this {
    const normalizada = placa.toUpperCase().replace(/\s/g, '');
    if (!Encargo.validarPlaca(normalizada)) {
      throw new PlacaInvalidaException(placa);
    }
    this.placa = normalizada;
    return this;
  }

  conTipoEvento(tipo: TipoEvento): this {
    this.tipoEvento = tipo;
    return this;
  }

  conEstado(estado: EstadoEncargo): this {
    this.estado = estado;
    return this;
  }

  conDenunciante(rut: string, nombre: string, email: string): this {
    this.denuncianteRut = rut;
    this.denuncianteNombre = nombre;
    this.denuncianteEmail = email;
    return this;
  }

  conCanalNotificacion(canal: string): this {
    this.canalNotificacion = canal;
    return this;
  }

  conConstancia(numero: string): this {
    this.constanciaNumero = numero;
    return this;
  }

  conFechaHecho(fecha: Date): this {
    this.fechaHecho = fecha;
    return this;
  }

  conObservaciones(obs: string): this {
    this.observaciones = obs;
    return this;
  }

  conUnidad(unidadId: string): this {
    this.unidadId = unidadId;
    return this;
  }

  conFuncionario(funcionarioId: string): this {
    this.funcionarioId = funcionarioId;
    return this;
  }

  conAnulacion(supervisorId: string, motivo: string): this {
    this.anuladoPor = supervisorId;
    this.motivoAnulacion = motivo;
    return this;
  }

  conFechas(created: Date, updated: Date): this {
    this.createdAt = created;
    this.updatedAt = updated;
    return this;
  }

  build(): Encargo {
    return Encargo.fromBuilder(this);
  }
}