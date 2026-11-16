import { PlacaPublica } from '../../domain/entities';
import { PlacaPublicaRepository } from '../../domain/ports';
import { Encargo } from '../../domain/entities';

export interface ConsultaPlacaPublicaOutput {
  encontrada: boolean;
  placa: string;
  estado: string | null;
  mensaje: string;
  unidad: {
    nombre: string;
    direccion: string;
    comuna: string;
    region: string;
    latitud: number | null;
    longitud: number | null;
    horarioAtencion: string | null;
    telefono: string | null;
  } | null;
  requisitosRetiro: string | null;
  fechaIngreso: Date | null;
}

export class ConsultarPlacaPublicaUseCase {
  constructor(
    private readonly placaPublicaRepo: PlacaPublicaRepository,
  ) {}

  async ejecutar(placa: string): Promise<ConsultaPlacaPublicaOutput> {
    // Validar formato básico
    const normalizada = placa.toUpperCase().replace(/[-\s·]/g, '');
    if (!Encargo.validarPlaca(normalizada)) {
      return {
        encontrada: false,
        placa: normalizada,
        estado: null,
        mensaje: 'El formato de la patente no es válido. Use formato BBCC12 o XX1234.',
        unidad: null,
        requisitosRetiro: null,
        fechaIngreso: null,
      };
    }

    const resultado = await this.placaPublicaRepo.buscarPorPlaca(normalizada);

    if (!resultado) {
      return {
        encontrada: false,
        placa: normalizada,
        estado: null,
        mensaje: 'No se encontraron registros para esta patente en el sistema.',
        unidad: null,
        requisitosRetiro: null,
        fechaIngreso: null,
      };
    }

    const mensajes: Record<string, string> = {
      EN_BUSQUEDA: 'Esta placa patente fue reportada como extraviada o robada y se encuentra en búsqueda activa.',
      EN_CUSTODIA: 'Esta placa patente fue encontrada y se encuentra bajo custodia policial. Acérquese a la unidad indicada para verificar si corresponde a su vehículo.',
      DISPONIBLE_PARA_RETIRO: 'Su placa patente fue encontrada y está disponible para retiro en la unidad policial indicada.',
      ENTREGADA: 'Esta placa patente ya fue entregada a su propietario.',
    };

    return {
      encontrada: true,
      placa: resultado.placa,
      estado: resultado.estado,
      mensaje: mensajes[resultado.estado] ?? 'Estado desconocido.',
      unidad: {
        nombre: resultado.unidadNombre,
        direccion: resultado.unidadDireccion,
        comuna: resultado.unidadComuna,
        region: resultado.unidadRegion,
        latitud: resultado.unidadLatitud,
        longitud: resultado.unidadLongitud,
        horarioAtencion: resultado.horarioAtencion,
        telefono: resultado.telefonoUnidad,
      },
      requisitosRetiro: resultado.requisitosRetiro,
      fechaIngreso: resultado.fechaIngreso,
    };
  }
}