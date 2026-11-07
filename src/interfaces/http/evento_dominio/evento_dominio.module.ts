import { Module } from '@nestjs/common';
import { EventoDominioController } from './evento_dominio.controller';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { EventoDominioService } from './evento_dominio.service';


@Module({
  controllers: [EventoDominioController],
  providers: [EventoDominioService, PrismaService],
  exports: [EventoDominioService],
})
export class EventoDominioModule {}