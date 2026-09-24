import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'placaChilena', async: false })
export class PlacaChilenaConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return false;
    const normalizada = value.toUpperCase().replace(/[-\s]/g, '');
    return /^[A-Z]{2,4}\d{2,4}$/.test(normalizada);
  }

  defaultMessage(): string {
    return 'La placa "$value" no tiene un formato chileno válido';
  }
}

export function IsPlacaChilena(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: PlacaChilenaConstraint,
    });
  };
}