import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ExpirarEncargosUseCase } from '../../application/encargos/expirar-encargos.use-case';

@Injectable()
export class EncargoExpirationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EncargoExpirationService.name);
  private intervalId: NodeJS.Timeout | null = null;

  // Ejecutar cada 24 horas (en milisegundos)
  private static readonly INTERVALO_MS = 24 * 60 * 60 * 1000;

  constructor(private readonly expirarEncargos: ExpirarEncargosUseCase) {}

  onModuleInit() {
    this.logger.log('Servicio de expiración de encargos iniciado');

    // Ejecutar al iniciar la app
    this.ejecutarExpiracion();

    // Programar ejecución cada 24 horas
    this.intervalId = setInterval(
      () => this.ejecutarExpiracion(),
      EncargoExpirationService.INTERVALO_MS,
    );
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.logger.log('Servicio de expiración de encargos detenido');
    }
  }

  private async ejecutarExpiracion(): Promise<void> {
    try {
      this.logger.log('Verificando encargos expirados...');
      const resultado = await this.expirarEncargos.ejecutar();

      if (resultado.expirados > 0) {
        this.logger.log(
          `Se expiraron ${resultado.expirados} encargo(s): ${resultado.placas.join(', ')}`,
        );
      } else {
        this.logger.log('No hay encargos por expirar');
      }
    } catch (error) {
      this.logger.error('Error al ejecutar expiración de encargos:', error);
    }
  }
}