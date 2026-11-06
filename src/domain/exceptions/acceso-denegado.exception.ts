import { DomainException } from './domain.exception';

export class AccesoDenegadoException extends DomainException {
  constructor(accion: string, rol: string) {
    super(
      `El rol ${rol} no tiene permisos para ${accion}`,
      'ACCESO_DENEGADO',
    );
  }
}