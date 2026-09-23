import { v4 as uuid } from 'uuid';
import { Encargo, EventoDominio } from '../../domain/entities';
import { TipoEvento, TipoEventoDominio } from '../../domain/enums';
import {
  EncargoRepository,
  EventoDominioRepository,
  VehiculoRegistryPort,
} from '../../domain/ports';
import { PlacaInvalidaException } from '../../domain/exceptions';

export interface RegistrarEncargoInput {
  placa: string;
  tipoEvento: TipoEvento;
  denuncianteRut: string;
  denuncianteNombre: string;
  denuncianteEmail: string;
  canalNotificacion: string;
  constanciaNumero?: string;
  fechaHecho: Date;
  observaciones?: string;
  unidadId: string;
  funcionarioId: string;
}

export interface RegistrarEncargoOutput {
  encargo: Encargo;
  hallazgoPrevioExistente: boolean;
}

export class RegistrarEncargoUseCase {
  constructor(
    private readonly encargoRepo: EncargoRepository,
    private readonly eventoRepo: EventoDominioRepository,
    private readonly vehiculoRegistry: VehiculoRegistryPort,
  ) {}

  async ejecutar(input: RegistrarEncargoInput): Promise<RegistrarEncargoOutput> {
    if (!Encargo.validarPlaca(input.placa)) {
      throw new PlacaInvalidaException(input.placa);
    }

    const existe = await this.vehiculoRegistry.existePlaca(input.placa);
    if (!existe) {
      throw new PlacaInvalidaException(input.placa);
    }

    const encargoExistente = await this.encargoRepo.buscarVigentePorPlaca(input.placa);
    if (encargoExistente) {
      throw new Error(`Ya existe un encargo vigente para la placa ${input.placa}`);
    }

    const encargo = Encargo.builder()
      .conId(uuid())
      .conPlaca(input.placa)
      .conTipoEvento(input.tipoEvento)
      .conDenunciante(input.denuncianteRut, input.denuncianteNombre, input.denuncianteEmail)
      .conCanalNotificacion(input.canalNotificacion)
      .conFechaHecho(input.fechaHecho)
      .conUnidad(input.unidadId)
      .conFuncionario(input.funcionarioId)
      .build();

    const encargoGuardado = await this.encargoRepo.guardar(encargo);

    const evento = EventoDominio.crear(TipoEventoDominio.PLACA_ENCARGADA, {
      encargoId: encargoGuardado.id,
      placa: encargoGuardado.placa,
      unidadId: encargoGuardado.unidadId,
      funcionarioId: encargoGuardado.funcionarioId,
    });
    await this.eventoRepo.guardar(evento);

    return {
      encargo: encargoGuardado,
      hallazgoPrevioExistente: false,
    };
  }
}