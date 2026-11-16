import { v4 as uuid } from 'uuid';
import { Encargo, EventoDominio } from '../../domain/entities';
import { TipoEvento, TipoEventoDominio, EstadoPlacaPublica } from '../../domain/enums';
import {
  EncargoRepository,
  EventoDominioRepository,
  VehiculoRegistryPort,
  HallazgoRepository,
  UnidadRepository,
  UsuarioRepository,
  EventPublisherPort,
} from '../../domain/ports';
import { PlacaInvalidaException, AccesoDenegadoException } from '../../domain/exceptions';
import { ConciliarPlacaUseCase } from '../conciliacion/conciliar-placa.use-case';
import { PublicarPlacaPublicaUseCase } from '../placa-publica/publicar-placa-publica.use-case';

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
    private readonly hallazgoRepo: HallazgoRepository,
    private readonly unidadRepo: UnidadRepository,
    private readonly usuarioRepo: UsuarioRepository,
    private readonly eventPublisher: EventPublisherPort,
    private readonly publicarPlaca: PublicarPlacaPublicaUseCase, // ← NUEVO
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

    // 5. Publicar evento a la cola (observadores reaccionan de forma asíncrona)
    try {
      await this.eventPublisher.publicar(TipoEventoDominio.PLACA_ENCARGADA, {
        encargoId: encargoGuardado.id,
        placa: encargoGuardado.placa,
        unidadId: encargoGuardado.unidadId,
        funcionarioId: encargoGuardado.funcionarioId,
      });
    } catch (error) {
      console.error('Error publicando evento PLACA_ENCARGADA:', (error as Error).message);
    }

    // ══ NUEVO: Publicar a tabla pública con estado EN_BUSQUEDA ══
    try {
      await this.publicarPlaca.ejecutar({
        placa: encargoGuardado.placa,
        estado: EstadoPlacaPublica.EN_BUSQUEDA,
        unidadId: encargoGuardado.unidadId,
        fechaIngreso: new Date(),
      });
    } catch (error) {
      // No debe fallar el flujo principal si la publicación pública falla
      console.error('Error publicando placa a tabla pública:', (error as Error).message);
    }

    // 6. Intentar conciliación automática (síncrona — el usuario necesita el resultado)
    //    Si concilia, el evento PLACA_REUNIFICADA se publica desde ConciliarPlacaUseCase
    //    y el processor se encarga de enviar el email de notificación.
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

      // ── La notificación por email ahora la maneja el processor de BullMQ ──
      // ── al recibir el evento PLACA_REUNIFICADA (patrón Observer) ──

      // Obtener datos del hallazgo para la respuesta al frontend
      const hallazgo = await this.obtenerDatosHallazgo(resultado.reunificacion.hallazgoId);

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