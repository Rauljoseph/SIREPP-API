import { Logger } from '@nestjs/common';
import { EventoHandler } from './evento-handler.interface';

// Handler genérico para eventos que solo requieren log (sin notificación)
export class LogOnlyHandler implements EventoHandler {
  private readonly logger = new Logger(LogOnlyHandler.name);

  constructor(private readonly mensaje: string) {}

  async handle(data: Record<string, unknown>): Promise<void> {
    this.logger.log(`${this.mensaje} — ${JSON.stringify(data)}`);
  }
}