import { EstadoPlacaPublica } from '../enums';

export class PlacaPublica {
  readonly id: string;
  readonly placa: string;
  readonly estado: EstadoPlacaPublica;
  readonly unidadNombre: string;
  readonly unidadDireccion: string;
  readonly unidadComuna: string;
  readonly unidadRegion: string;
  readonly unidadLatitud: number | null;
  readonly unidadLongitud: number | null;
  readonly horarioAtencion: string | null;
  readonly telefonoUnidad: string | null;
  readonly requisitosRetiro: string | null;
  readonly fechaIngreso: Date;
  readonly fechaPublicacion: Date;
  readonly updatedAt: Date;

  private constructor(builder: PlacaPublicaBuilder) {
    this.id = builder.id;
    this.placa = builder.placa;
    this.estado = builder.estado;
    this.unidadNombre = builder.unidadNombre;
    this.unidadDireccion = builder.unidadDireccion;
    this.unidadComuna = builder.unidadComuna;
    this.unidadRegion = builder.unidadRegion;
    this.unidadLatitud = builder.unidadLatitud;
    this.unidadLongitud = builder.unidadLongitud;
    this.horarioAtencion = builder.horarioAtencion;
    this.telefonoUnidad = builder.telefonoUnidad;
    this.requisitosRetiro = builder.requisitosRetiro;
    this.fechaIngreso = builder.fechaIngreso;
    this.fechaPublicacion = builder.fechaPublicacion;
    this.updatedAt = builder.updatedAt;
  }

  static builder(): PlacaPublicaBuilder {
    return new PlacaPublicaBuilder();
  }

  estaDisponibleParaRetiro(): boolean {
    return this.estado === EstadoPlacaPublica.DISPONIBLE_PARA_RETIRO;
  }

  estaEnCustodia(): boolean {
    return this.estado === EstadoPlacaPublica.EN_CUSTODIA;
  }

  cambiarEstado(nuevoEstado: EstadoPlacaPublica): PlacaPublica {
    return PlacaPublica.builder()
      .fromExisting(this)
      .conEstado(nuevoEstado)
      .build();
  }

  static fromBuilder(builder: PlacaPublicaBuilder): PlacaPublica {
    return new PlacaPublica(builder);
  }
}

export class PlacaPublicaBuilder {
  id: string = '';
  placa: string = '';
  estado: EstadoPlacaPublica = EstadoPlacaPublica.EN_CUSTODIA;
  unidadNombre: string = '';
  unidadDireccion: string = '';
  unidadComuna: string = '';
  unidadRegion: string = '';
  unidadLatitud: number | null = null;
  unidadLongitud: number | null = null;
  horarioAtencion: string | null = null;
  telefonoUnidad: string | null = null;
  requisitosRetiro: string | null = null;
  fechaIngreso: Date = new Date();
  fechaPublicacion: Date = new Date();
  updatedAt: Date = new Date();

  fromExisting(entity: PlacaPublica): this {
    this.id = entity.id;
    this.placa = entity.placa;
    this.estado = entity.estado;
    this.unidadNombre = entity.unidadNombre;
    this.unidadDireccion = entity.unidadDireccion;
    this.unidadComuna = entity.unidadComuna;
    this.unidadRegion = entity.unidadRegion;
    this.unidadLatitud = entity.unidadLatitud;
    this.unidadLongitud = entity.unidadLongitud;
    this.horarioAtencion = entity.horarioAtencion;
    this.telefonoUnidad = entity.telefonoUnidad;
    this.requisitosRetiro = entity.requisitosRetiro;
    this.fechaIngreso = entity.fechaIngreso;
    this.fechaPublicacion = entity.fechaPublicacion;
    this.updatedAt = new Date();
    return this;
  }

  conId(id: string): this {
    this.id = id;
    return this;
  }

  conPlaca(placa: string): this {
    this.placa = placa.toUpperCase().replace(/[-\s·]/g, '');
    return this;
  }

  conEstado(estado: EstadoPlacaPublica): this {
    this.estado = estado;
    return this;
  }

  conUnidad(nombre: string, direccion: string, comuna: string, region: string): this {
    this.unidadNombre = nombre;
    this.unidadDireccion = direccion;
    this.unidadComuna = comuna;
    this.unidadRegion = region;
    return this;
  }

  conCoordenadas(latitud: number | null, longitud: number | null): this {
    this.unidadLatitud = latitud;
    this.unidadLongitud = longitud;
    return this;
  }

  conHorario(horario: string | null): this {
    this.horarioAtencion = horario;
    return this;
  }

  conTelefono(telefono: string | null): this {
    this.telefonoUnidad = telefono;
    return this;
  }

  conRequisitos(requisitos: string): this {
    this.requisitosRetiro = requisitos;
    return this;
  }

  conFechaIngreso(fecha: Date): this {
    this.fechaIngreso = fecha;
    return this;
  }

  conFechas(publicacion: Date, updated: Date): this {
    this.fechaPublicacion = publicacion;
    this.updatedAt = updated;
    return this;
  }

  build(): PlacaPublica {
    return PlacaPublica.fromBuilder(this);
  }
}