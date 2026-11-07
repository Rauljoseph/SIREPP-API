import { Injectable } from '@nestjs/common';
import { TipoEventoDominio } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

@Injectable()
export class EventoDominioService {
  constructor(private readonly prisma: PrismaService) {}

  async publicar(tipo: TipoEventoDominio, payload: Record<string, any>) {
    return this.prisma.eventoDominio.create({
      data: {
        tipo,
        payload,
      },
    });
  }

  async marcarProcesado(id: number) {
    return this.prisma.eventoDominio.update({
      where: { id },
      data: { procesado: true },
    });
  }

  async marcarTodosProcesados() {
    return this.prisma.eventoDominio.updateMany({
      where: { procesado: false },
      data: { procesado: true },
    });
  }
}