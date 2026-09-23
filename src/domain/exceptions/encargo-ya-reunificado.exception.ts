import { DomainException } from './domain.exception';

export class EncargoYaReunificadoException extends DomainException {
  constructor(placa: string) {
    super(`La placa "${placa}" ya fue reunificada`, 'ENCARGO_YA_REUNIFICADO');
  }
}