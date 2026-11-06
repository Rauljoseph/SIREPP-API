import { v4 as uuid } from 'uuid';
import { Encargo, EventoDominio } from '../../domain/entities';
import { Unidad } from '../../domain/entities';
import { TipoEvento, TipoEventoDominio } from '../../domain/enums';
import {
  EncargoRepository,
  EventoDominioRepository,
  VehiculoRegistryPort,
  HallazgoRepository,
  ReunificacionRepository,
  NotificacionRepository,
  MailSenderPort,
  UnidadRepository,
  UsuarioRepository,
} from '../../domain/ports';
import { PlacaInvalidaException, AccesoDenegadoException } from '../../domain/exceptions';
import { ConciliarPlacaUseCase } from '../conciliacion/conciliar-placa.use-case';
import { EnviarNotificacionReunificacionUseCase } from '../notificaciones/enviar-notificacion-reunificacion.use-case';

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

export interface DatosHallazgoPrevio {
  id: string;
  estadoFisico: string;
  fechaHallazgo: Date;
  unidadId: string;
}

export interface DatosUnidadCustodia {
  nombre: string;
  direccion: string;
  comuna: string;
  region: string;
  horarioAtencion: string;
  telefono: string;
}

export interface RegistrarEncargoOutput {
  encargo: Encargo;
  conciliacion: {
    reunificacionId: string;
    mensaje: string;
    hallazgo: DatosHallazgoPrevio;
    unidadCustodia: DatosUnidadCustodia | null;
  } | null;
}

export class RegistrarEncargoUseCase {
  constructor(
    private readonly encargoRepo: EncargoRepository,
    private readonly eventoRepo: EventoDominioRepository,
    private readonly vehiculoRegistry: VehiculoRegistryPort,
    private readonly conciliar: ConciliarPlacaUseCase,
    private readonly notificar: EnviarNotificacionReunificacionUseCase,
    private readonly hallazgoRepo: HallazgoRepository,
    private readonly unidadRepo: UnidadRepository,
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async ejecutar(input: RegistrarEncargoInput): Promise<RegistrarEncargoOutput> {
    // 0. Validar permisos del funcionario
    const funcionario = await this.usuarioRepo.buscarPorId(input.funcionarioId);
    if (funcionario && !funcionario.puedeRegistrar()) {
      throw new AccesoDenegadoException('registrar encargos', funcionario.rol);
    }

    if (!Encargo.validarPlaca(input.placa)) {
      throw new PlacaInvalidaException(input.placa);
    }

    // 2. Validar que la placa exista en el registro vehicular
    // const existe = await this.vehiculoRegistry.existePlaca(input.placa);
    // if (!existe) {
    //   throw new Error(`La placa ${input.placa} no se encuentra en el registro vehicular`);
    // }

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

    const conciliacion = await this.intentarConciliacion(encargoGuardado);

    return {
      encargo: encargoGuardado,
      conciliacion,
    };
  }

  private async intentarConciliacion(
    encargo: Encargo,
  ): Promise<RegistrarEncargoOutput['conciliacion']> {
    try {
      const resultado = await this.conciliar.desdeEncargo({
        encargoId: encargo.id,
        placa: encargo.placa,
      });

      if (!resultado?.conciliada || !resultado?.reunificacion) {
        return null;
      }

      // Notificar — si falla no bloquea la operación
      try {
        await this.notificar.ejecutar({
          reunificacionId: resultado.reunificacion.id,
        });
      } catch (error) {
        console.error('Error al enviar notificación:', (error as Error).message);
      }

      // Obtener datos del hallazgo
      const hallazgo = await this.obtenerDatosHallazgo(resultado.reunificacion.hallazgoId);

      // Obtener unidad de custodia
      const unidadCustodia = hallazgo
        ? await this.obtenerUnidadCustodia(hallazgo.unidadId)
        : null;

      return {
        reunificacionId: resultado.reunificacion.id,
        mensaje: 'Esta placa ya fue encontrada y se encuentra disponible para retiro.',
        hallazgo: hallazgo!,
        unidadCustodia,
      };
    } catch (error) {
      console.error('Error en conciliación automática:', (error as Error).message);
      return null;
    }
  }

  private async obtenerDatosHallazgo(hallazgoId: string): Promise<DatosHallazgoPrevio | null> {
    try {
      const hallazgo = await this.hallazgoRepo.buscarPorId(hallazgoId);
      if (!hallazgo) return null;
      return {
        id: hallazgo.id,
        estadoFisico: hallazgo.estadoFisico,
        fechaHallazgo: hallazgo.createdAt,
        unidadId: hallazgo.unidadId,
      };
    } catch {
      return null;
    }
  }

  private async obtenerUnidadCustodia(unidadId: string): Promise<DatosUnidadCustodia | null> {
    try {
      const unidad = await this.unidadRepo.buscarPorId(unidadId);
      if (!unidad) return null;
      return {
        nombre: unidad.nombre,
        direccion: unidad.direccion,
        comuna: unidad.comuna,
        region: unidad.region,
        horarioAtencion: unidad.horarioAtencion ?? 'No disponible',
        telefono: unidad.telefono ?? 'No disponible',
      };
    } catch {
      return null;
    }
  }
}