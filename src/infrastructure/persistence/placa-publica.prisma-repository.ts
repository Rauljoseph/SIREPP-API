import { Injectable } from '@nestjs/common';
import { PlacaPublicaRepository } from '../../domain/ports';
import { PlacaPublica } from '../../domain/entities';
import { PrismaService } from './prisma/prisma.service';
import { PlacaPublicaMapper } from './mappers/placa-publica.mapper';

@Injectable()
export class PlacaPublicaPrismaRepository implements PlacaPublicaRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: PlacaPublicaMapper,
  ) {}

  async guardar(placaPublica: PlacaPublica): Promise<PlacaPublica> {
    const data = this.mapper.toPrisma(placaPublica);

    // upsert: si la placa ya existe en la tabla pública, actualiza el estado
    const resultado = await this.prisma.placaPublica.upsert({
      where: { placa: placaPublica.placa },
      create: data,
      update: {
        estado: data.estado,
        unidadNombre: data.unidadNombre,
        unidadDireccion: data.unidadDireccion,
        unidadComuna: data.unidadComuna,
        unidadRegion: data.unidadRegion,
        unidadLatitud: data.unidadLatitud,
        unidadLongitud: data.unidadLongitud,
        horarioAtencion: data.horarioAtencion,
        telefonoUnidad: data.telefonoUnidad,
        requisitosRetiro: data.requisitosRetiro,
        fechaIngreso: data.fechaIngreso,
      },
    });

    return this.mapper.toDomain(resultado);
  }

  async actualizar(placaPublica: PlacaPublica): Promise<PlacaPublica> {
    const data = this.mapper.toPrisma(placaPublica);

    const resultado = await this.prisma.placaPublica.update({
      where: { placa: placaPublica.placa },
      data: {
        estado: data.estado,
        unidadNombre: data.unidadNombre,
        unidadDireccion: data.unidadDireccion,
        unidadComuna: data.unidadComuna,
        unidadRegion: data.unidadRegion,
        unidadLatitud: data.unidadLatitud,
        unidadLongitud: data.unidadLongitud,
        horarioAtencion: data.horarioAtencion,
        telefonoUnidad: data.telefonoUnidad,
        requisitosRetiro: data.requisitosRetiro,
        fechaIngreso: data.fechaIngreso,
      },
    });

    return this.mapper.toDomain(resultado);
  }

  async buscarPorPlaca(placa: string): Promise<PlacaPublica | null> {
    const normalizada = placa.toUpperCase().replace(/[-\s·]/g, '');

    const resultado = await this.prisma.placaPublica.findUnique({
      where: { placa: normalizada },
    });

    return resultado ? this.mapper.toDomain(resultado) : null;
  }
}