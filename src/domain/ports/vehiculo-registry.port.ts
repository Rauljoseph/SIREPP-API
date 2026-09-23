export interface DatosVehiculo {
  placa: string;
  propietarioNombre: string;
  propietarioRut: string;
  propietarioEmail: string;
  vigente: boolean;
}

export interface VehiculoRegistryPort {
  buscarPorPlaca(placa: string): Promise<DatosVehiculo | null>;
  existePlaca(placa: string): Promise<boolean>;
}

export const VEHICULO_REGISTRY = Symbol('VehiculoRegistryPort');