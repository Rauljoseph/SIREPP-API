import { Reunificacion, EventoDominio } from '../../domain/entities';
import { TipoEventoDominio } from '../../domain/enums';
import {
  ReunificacionRepository,
  EncargoRepository,
  EventoDominioRepository, UsuarioRepository,
} from '../../domain/ports';
import { AccesoDenegadoException } from '../../domain/exceptions';

export interface CerrarCasoInput {
  reunificacionId: string;
  funcionarioEntregaId: string;
  receptorRut: string;
  receptorNombre: string;
}

export class CerrarCasoUseCase {
  constructor(
    private readonly reunificacionRepo: ReunificacionRepository,
    private readonly encargoRepo: EncargoRepository,
    private readonly eventoRepo: EventoDominioRepository,
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async ejecutar(input: CerrarCasoInput): Promise<Reunificacion> {
    // Validar permisos: solo GUARDIA y SUPERVISOR pueden entregar
    const funcionario = await this.usuarioRepo.buscarPorId(input.funcionarioEntregaId);
    if (funcionario && !funcionario.puedeRegistrar() && !funcionario.puedeAnular()) {
      throw new AccesoDenegadoException('cerrar casos', funcionario.rol);
    }

    const reunificacion = await this.reunificacionRepo.buscarPorId(input.reunificacionId);
    if (!reunificacion) {
      throw new Error(`Reunificación ${input.reunificacionId} no encontrada`);
    }

    // Transición de estado en la entidad
    const entregada = reunificacion.entregar(
      input.funcionarioEntregaId,
      input.receptorRut,
      input.receptorNombre,
    );
    const actualizada = await this.reunificacionRepo.actualizar(entregada);

    // Cerrar el encargo
    const encargo = await this.encargoRepo.buscarPorId(reunificacion.encargoId);
    if (encargo) {
      const cerrado = encargo.cerrar();
      await this.encargoRepo.actualizar(cerrado);
    }

    // Evento de dominio
    const evento = EventoDominio.crear(TipoEventoDominio.CASO_CERRADO, {
      reunificacionId: actualizada.id,
      encargoId: reunificacion.encargoId,
      funcionarioEntregaId: input.funcionarioEntregaId,
    });
    await this.eventoRepo.guardar(evento);

    return actualizada;
  }
}