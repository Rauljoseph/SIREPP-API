import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TipoEventoDominio } from '../../domain/enums';
import { EventoHandler } from './handlers';

// Token para inyectar el Map de estrategias
export const EVENTO_HANDLERS = Symbol('EVENTO_HANDLERS');

@Processor('sirepp-eventos')
export class SireppEventosProcessor extends WorkerHost {
  private readonly logger = new Logger(SireppEventosProcessor.name);

  constructor(
    @Inject(EVENTO_HANDLERS)
    private readonly handlers: Map<TipoEventoDominio, EventoHandler>,
  ) {
    super();
  }

  async process(job: Job<Record<string, unknown>>): Promise<void> {
    const tipo = job.name as TipoEventoDominio;
    this.logger.log(`Procesando evento: ${tipo} (job ${job.id})`);

    const handler = this.handlers.get(tipo);

    if (!handler) {
      this.logger.warn(`Tipo de evento no manejado: ${tipo}`);
      return;
    }

    await handler.handle(job.data);
  }
}