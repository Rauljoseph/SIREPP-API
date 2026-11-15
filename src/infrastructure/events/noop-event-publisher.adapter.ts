// src/infrastructure/events/noop-event-publisher.adapter.ts
// ── ARCHIVO NUEVO ──
// Adapter que no hace nada: se usa cuando EVENTS_ENABLED !== 'true'.
// El flujo síncrono original sigue funcionando sin cambios.

import { Injectable, Logger } from '@nestjs/common';
import { EventPublisherPort } from '../../domain/ports';

@Injectable()
export class NoopEventPublisherAdapter implements EventPublisherPort {
  private readonly logger = new Logger(NoopEventPublisherAdapter.name);

  async publicar(evento: string, _payload: Record<string, unknown>): Promise<void> {
    this.logger.debug(`Evento ${evento} omitido (EVENTS_ENABLED ≠ true)`);
  }
}