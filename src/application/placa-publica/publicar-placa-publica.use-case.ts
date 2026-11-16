import { v4 as uuid } from 'uuid';
import { PlacaPublica } from '../../domain/entities';
import { EstadoPlacaPublica } from '../../domain/enums';
import { PlacaPublicaRepository, UnidadRepository } from '../../domain/ports';

export interface PublicarPlacaInput {
  placa: string;
  estado: EstadoPlacaPublica;
  unidadId: string;
  fechaIngreso: Date;
}

const REQUISITOS_RETIRO = [
  '• Cédula de identidad vigente del propietario',
  '• Certificado de inscripción del vehículo o padrón',
  '• Constancia de extravío o denuncia (si aplica)',
  '• En caso de representante: poder notarial simple',
].join('\n');

export class PublicarPlacaPublicaUseCase {
  constructor(
    private readonly placaPublicaRepo: PlacaPublicaRepository,
    private readonly unidadRepo: UnidadRepository,
  ) {}

  async ejecutar(input: PublicarPlacaInput): Promise<PlacaPublica> {
    // 1. Obtener datos de la unidad policial
    const unidad = await this.unidadRepo.buscarPorId(input.unidadId);
    if (!unidad) {
      throw new Error(`Unidad ${input.unidadId} no encontrada`);
    }

    // 2. Construir la entidad pública
    const placaPublica = PlacaPublica.builder()
      .conId(uuid())
      .conPlaca(input.placa)
      .conEstado(input.estado)
      .conUnidad(
        unidad.nombre,
        unidad.direccion,
        unidad.comuna,
        unidad.region,
      )
      .conCoordenadas(null, null) // TODO: agregar lat/lng a Unidad si se necesita
      .conHorario(unidad.horarioAtencion ?? 'Lunes a Viernes 08:00 - 14:00 hrs')
      .conTelefono(unidad.telefono ?? null)
      .conRequisitos(REQUISITOS_RETIRO)
      .conFechaIngreso(input.fechaIngreso)
      .build();

    // 3. Guardar (upsert: si ya existe la placa, actualiza)
    return this.placaPublicaRepo.guardar(placaPublica);
  }
}