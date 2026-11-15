// src/infrastructure/events/bull-board.module.ts
// ── ARCHIVO NUEVO ──
// Dashboard visual para monitorear las colas BullMQ
// Accesible en http://localhost:3000/admin/queues

import { Module } from '@nestjs/common';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Module({
  imports: [
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'sirepp-eventos',
      adapter: BullMQAdapter,
    }),
  ],
})
export class BullBoardConfigModule {}