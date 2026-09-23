import { Injectable, Logger } from '@nestjs/common';
import { DatosVehiculo, VehiculoRegistryPort } from '../../domain/ports';

@Injectable()
export class VehiculoRegistryMockAdapter implements VehiculoRegistryPort {
  private readonly logger = new Logger('VehiculoRegistry');

  // Placas de prueba que el mock reconoce como válidas
  private readonly placas: Map<string, DatosVehiculo> = new Map([
    ['BBCC12', {
      placa: 'BBCC12',
      propietarioNombre: 'Juan Pérez González',
      propietarioRut: '12.345.678-9',
      propietarioEmail: 'juan.perez@mail.cl',
      vigente: true,
    }],
    ['DDFG34', {
      placa: 'DDFG34',
      propietarioNombre: 'María López Soto',
      propietarioRut: '9.876.543-2',
      propietarioEmail: 'maria.lopez@mail.cl',
      vigente: true,
    }],
    ['HHKL56', {
      placa: 'HHKL56',
      propietarioNombre: 'Carlos Muñoz Reyes',
      propietarioRut: '15.432.109-0',
      propietarioEmail: 'carlos.munoz@mail.cl',
      vigente: true,
    }],
    ['RRST78', {
      placa: 'RRST78',
      propietarioNombre: 'Ana Contreras Díaz',
      propietarioRut: '11.222.333-4',
      propietarioEmail: 'ana.contreras@mail.cl',
      vigente: true,
    }],
  ]);

  async buscarPorPlaca(placa: string): Promise<DatosVehiculo | null> {
    const normalizada = placa.toUpperCase().replace(/[-\s]/g, '');
    const datos = this.placas.get(normalizada) ?? null;
    this.logger.debug(`Consulta placa ${normalizada}: ${datos ? 'encontrada' : 'no encontrada'}`);
    return datos;
  }

  async existePlaca(placa: string): Promise<boolean> {
    const datos = await this.buscarPorPlaca(placa);
    return datos !== null;
  }
}