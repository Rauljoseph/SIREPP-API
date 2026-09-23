import { DomainException } from './domain.exception';

export class HallazgoNoEncontradoException extends DomainException {
  constructor(identificador: string) {
    super(`No se encontró un hallazgo con identificador "${identificador}"`, 'HALLAZGO_NO_ENCONTRADO');
  }
}