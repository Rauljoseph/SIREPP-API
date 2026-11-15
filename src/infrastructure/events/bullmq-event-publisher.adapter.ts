// src/infrastructure/events/bullmq-event-publisher.adapter.ts
// ── ARCHIVO NUEVO ──

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EventPublisherPort } from '../../domain/ports';

@Injectable()
export class BullMqEventPublisherAdapter implements EventPublisherPort {
  private readonly logger = new Logger(BullMqEventPublisherAdapter.name);

  constructor(
    @InjectQueue('sirepp-eventos') private readonly eventosQueue: Queue,
  ) {}

  async publicar(evento: string, payload: Record<string, unknown>): Promise<void> {
    await this.eventosQueue.add(evento, {
      ...payload,
      publishedAt: new Date().toISOString(),
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 500 },
    });
    this.logger.log(`Evento publicado en cola: ${evento}`);
  }
}