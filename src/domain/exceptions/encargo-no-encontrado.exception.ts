import { DomainException } from './domain.exception';

export class EncargoNoEncontradoException extends DomainException {
  constructor(identificador: string) {
    super(`No se encontró un encargo con identificador "${identificador}"`, 'ENCARGO_NO_ENCONTRADO');
  }
}