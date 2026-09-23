import { DomainException } from './domain.exception';

export class PlacaInvalidaException extends DomainException {
  constructor(placa: string) {
    super(`El formato de la placa "${placa}" no es válido`, 'PLACA_INVALIDA');
  }
}