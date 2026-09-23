import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Prisma
import { PrismaModule } from './persistence/prisma/prisma.module';

// Crypto
import { AesCipherService } from './crypto/aes-cipher.service';

// Mappers
import { EncargoMapper } from './persistence/mappers/encargo.mapper';
import { HallazgoMapper } from './persistence/mappers/hallazgo.mapper';
import { ReunificacionMapper } from './persistence/mappers/reunificacion.mapper';
import { NotificacionMapper } from './persistence/mappers/notificacion.mapper';
import { EventoLecturaMapper } from './persistence/mappers/evento-lectura.mapper';
import { EventoDominioMapper } from './persistence/mappers/evento-dominio.mapper';

// Repositories
import { EncargoPrismaRepository } from './persistence/encargo.prisma-repository';
import { HallazgoPrismaRepository } from './persistence/hallazgo.prisma-repository';
import { ReunificacionPrismaRepository } from './persistence/reunificacion.prisma-repository';
import { NotificacionPrismaRepository } from './persistence/notificacion.prisma-repository';
import { EventoLecturaPrismaRepository } from './persistence/evento-lectura.prisma-repository';
import { EventoDominioPrismaRepository } from './persistence/evento-dominio.prisma-repository';

// Adapters
import { AuditLoggerPrismaAdapter } from './audit/audit-logger.prisma-adapter';
import { ConsoleMailAdapter } from './mail/console-mail.adapter';
import { VehiculoRegistryMockAdapter } from './external/vehiculo-registry.mock-adapter';

// Port tokens
import {
  ENCARGO_REPOSITORY,
  HALLAZGO_REPOSITORY,
  REUNIFICACION_REPOSITORY,
  NOTIFICACION_REPOSITORY,
  EVENTO_LECTURA_REPOSITORY,
  EVENTO_DOMINIO_REPOSITORY,
  AUDIT_LOGGER,
  MAIL_SENDER,
  VEHICULO_REGISTRY,
} from '../domain/ports';

// Use cases
import {
  RegistrarEncargoUseCase,
  AnularEncargoUseCase,
  ConsultarEncargoUseCase,
  RegistrarHallazgoUseCase,
  ConsultarHallazgoUseCase,
  ConciliarPlacaUseCase,
  EnviarNotificacionReunificacionUseCase,
  ReintentarNotificacionesUseCase,
  ProcesarLecturaUseCase,
  CerrarCasoUseCase,
  ConsultarEstadoPlacaUseCase,
} from '../application';

const repositories = [
  { provide: ENCARGO_REPOSITORY, useClass: EncargoPrismaRepository },
  { provide: HALLAZGO_REPOSITORY, useClass: HallazgoPrismaRepository },
  { provide: REUNIFICACION_REPOSITORY, useClass: ReunificacionPrismaRepository },
  { provide: NOTIFICACION_REPOSITORY, useClass: NotificacionPrismaRepository },
  { provide: EVENTO_LECTURA_REPOSITORY, useClass: EventoLecturaPrismaRepository },
  { provide: EVENTO_DOMINIO_REPOSITORY, useClass: EventoDominioPrismaRepository },
];

const adapters = [
  { provide: AUDIT_LOGGER, useClass: AuditLoggerPrismaAdapter },
  { provide: MAIL_SENDER, useClass: ConsoleMailAdapter },
  { provide: VEHICULO_REGISTRY, useClass: VehiculoRegistryMockAdapter },
];

const useCases = [
  {
    provide: RegistrarEncargoUseCase,
    useFactory: (encargoRepo, eventoRepo, vehiculoRegistry) =>
      new RegistrarEncargoUseCase(encargoRepo, eventoRepo, vehiculoRegistry),
    inject: [ENCARGO_REPOSITORY, EVENTO_DOMINIO_REPOSITORY, VEHICULO_REGISTRY],
  },
  {
    provide: AnularEncargoUseCase,
    useFactory: (encargoRepo, eventoRepo) =>
      new AnularEncargoUseCase(encargoRepo, eventoRepo),
    inject: [ENCARGO_REPOSITORY, EVENTO_DOMINIO_REPOSITORY],
  },
  {
    provide: ConsultarEncargoUseCase,
    useFactory: (encargoRepo) =>
      new ConsultarEncargoUseCase(encargoRepo),
    inject: [ENCARGO_REPOSITORY],
  },
  {
    provide: RegistrarHallazgoUseCase,
    useFactory: (hallazgoRepo, eventoRepo) =>
      new RegistrarHallazgoUseCase(hallazgoRepo, eventoRepo),
    inject: [HALLAZGO_REPOSITORY, EVENTO_DOMINIO_REPOSITORY],
  },
  {
    provide: ConsultarHallazgoUseCase,
    useFactory: (hallazgoRepo) =>
      new ConsultarHallazgoUseCase(hallazgoRepo),
    inject: [HALLAZGO_REPOSITORY],
  },
  {
    provide: ConciliarPlacaUseCase,
    useFactory: (encargoRepo, hallazgoRepo, reunificacionRepo, eventoRepo) =>
      new ConciliarPlacaUseCase(encargoRepo, hallazgoRepo, reunificacionRepo, eventoRepo),
    inject: [ENCARGO_REPOSITORY, HALLAZGO_REPOSITORY, REUNIFICACION_REPOSITORY, EVENTO_DOMINIO_REPOSITORY],
  },
  {
    provide: EnviarNotificacionReunificacionUseCase,
    useFactory: (reunificacionRepo, encargoRepo, notificacionRepo, mailSender) =>
      new EnviarNotificacionReunificacionUseCase(reunificacionRepo, encargoRepo, notificacionRepo, mailSender),
    inject: [REUNIFICACION_REPOSITORY, ENCARGO_REPOSITORY, NOTIFICACION_REPOSITORY, MAIL_SENDER],
  },
  {
    provide: ReintentarNotificacionesUseCase,
    useFactory: (notificacionRepo, mailSender) =>
      new ReintentarNotificacionesUseCase(notificacionRepo, mailSender),
    inject: [NOTIFICACION_REPOSITORY, MAIL_SENDER],
  },
  {
    provide: ProcesarLecturaUseCase,
    useFactory: (encargoRepo, eventoLecturaRepo, notificacionRepo, eventoRepo, mailSender) =>
      new ProcesarLecturaUseCase(encargoRepo, eventoLecturaRepo, notificacionRepo, eventoRepo, mailSender),
    inject: [ENCARGO_REPOSITORY, EVENTO_LECTURA_REPOSITORY, NOTIFICACION_REPOSITORY, EVENTO_DOMINIO_REPOSITORY, MAIL_SENDER],
  },
  {
    provide: CerrarCasoUseCase,
    useFactory: (reunificacionRepo, encargoRepo, eventoRepo) =>
      new CerrarCasoUseCase(reunificacionRepo, encargoRepo, eventoRepo),
    inject: [REUNIFICACION_REPOSITORY, ENCARGO_REPOSITORY, EVENTO_DOMINIO_REPOSITORY],
  },
  {
    provide: ConsultarEstadoPlacaUseCase,
    useFactory: (encargoRepo, hallazgoRepo, reunificacionRepo) =>
      new ConsultarEstadoPlacaUseCase(encargoRepo, hallazgoRepo, reunificacionRepo),
    inject: [ENCARGO_REPOSITORY, HALLAZGO_REPOSITORY, REUNIFICACION_REPOSITORY],
  },
];

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [
    // Servicios internos
    AesCipherService,
    // Mappers
    EncargoMapper,
    HallazgoMapper,
    ReunificacionMapper,
    NotificacionMapper,
    EventoLecturaMapper,
    EventoDominioMapper,
    // Repositories, adapters y use cases
    ...repositories,
    ...adapters,
    ...useCases,
  ],
  exports: [
    ...repositories.map((r) => r.provide),
    ...adapters.map((a) => a.provide),
    ...useCases.map((u) => u.provide),
    AesCipherService,
  ],
})
export class InfrastructureModule {}