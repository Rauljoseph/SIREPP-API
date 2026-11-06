import { Encargo, EventoDominio } from '../../domain/entities';
import { TipoEventoDominio } from '../../domain/enums';
import {
  EncargoRepository,
  EventoDominioRepository,
  UsuarioRepository,
} from '../../domain/ports';
import { EncargoNoEncontradoException, AccesoDenegadoException } from '../../domain/exceptions';

export interface AnularEncargoInput {
  encargoId: string;
  supervisorId: string;
  motivo: string;
}

export class AnularEncargoUseCase {
  constructor(
    private readonly encargoRepo: EncargoRepository,
    private readonly eventoRepo: EventoDominioRepository,
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async ejecutar(input: AnularEncargoInput): Promise<Encargo> {
    // Validar permisos del supervisor
    const supervisor = await this.usuarioRepo.buscarPorId(input.supervisorId);
    if (supervisor && !supervisor.puedeAnular()) {
      throw new AccesoDenegadoException('anular encargos', supervisor.rol);
    }

    const encargo = await this.encargoRepo.buscarPorId(input.encargoId);
    if (!encargo) {
      throw new EncargoNoEncontradoException(input.encargoId);
    }

    const anulado = encargo.anular(input.supervisorId, input.motivo);
    const actualizado = await this.encargoRepo.actualizar(anulado);

    const evento = EventoDominio.crear(TipoEventoDominio.ENCARGO_ANULADO, {
      encargoId: actualizado.id,
      placa: actualizado.placa,
      supervisorId: input.supervisorId,
      motivo: input.motivo,
    });
    await this.eventoRepo.guardar(evento);

    return actualizado;
  }
}