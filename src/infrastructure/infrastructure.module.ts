import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardConfigModule } from './events/bull-board.module';

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
import { UnidadMapper } from './persistence/mappers/unidad.mapper';
import { UsuarioMapper } from './persistence/mappers/usuario.mapper';
import { UNIDAD_REPOSITORY, USUARIO_REPOSITORY, EVENT_PUBLISHER } from '../domain/ports';
import { ConsultarUnidadUseCase } from '../application';

// Repositories
import { EncargoPrismaRepository } from './persistence/encargo.prisma-repository';
import { HallazgoPrismaRepository } from './persistence/hallazgo.prisma-repository';
import { ReunificacionPrismaRepository } from './persistence/reunificacion.prisma-repository';
import { NotificacionPrismaRepository } from './persistence/notificacion.prisma-repository';
import { EventoLecturaPrismaRepository } from './persistence/evento-lectura.prisma-repository';
import { EventoDominioPrismaRepository } from './persistence/evento-dominio.prisma-repository';
import { UnidadPrismaRepository } from './persistence/unidad.prisma-repository';
import { UsuarioPrismaRepository } from './persistence/usuario.prisma.repository';
import { ExpirarEncargosUseCase } from '../application';
import { EncargoExpirationService } from './scheduler/encargo-expiration-service';


// Adapters
import { AuditLoggerPrismaAdapter } from './audit/audit-logger.prisma-adapter';
import { GmailMailAdapter } from './mail/gmail-mail.adapter';
import { VehiculoRegistryMockAdapter } from './external/vehiculo-registry.mock-adapter';

// ── BullMQ: adapters de eventos (flag) ──
import { BullMqEventPublisherAdapter } from './events/bullmq-event-publisher.adapter';
import { NoopEventPublisherAdapter } from './events/noop-event-publisher.adapter';
import { SireppEventosProcessor, EVENTO_HANDLERS } from './events/sirepp-eventos.processor';

// ── Strategy: handlers de eventos ──
import {
  EventoHandler,
  PlacaReunificadaHandler,
  PlacaLeidaHandler,
  EncargoAnuladoHandler,
  EncargoExpiradoHandler,
  CasoCerradoHandler,
  LogOnlyHandler,
} from './events/handlers';
import { TipoEventoDominio } from '../domain/enums';

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

// ── Feature flag ──
const eventsEnabled = process.env.EVENTS_ENABLED === 'true';

const repositories = [
  { provide: ENCARGO_REPOSITORY, useClass: EncargoPrismaRepository },
  { provide: HALLAZGO_REPOSITORY, useClass: HallazgoPrismaRepository },
  { provide: REUNIFICACION_REPOSITORY, useClass: ReunificacionPrismaRepository },
  { provide: NOTIFICACION_REPOSITORY, useClass: NotificacionPrismaRepository },
  { provide: EVENTO_LECTURA_REPOSITORY, useClass: EventoLecturaPrismaRepository },
  { provide: EVENTO_DOMINIO_REPOSITORY, useClass: EventoDominioPrismaRepository },
  { provide: UNIDAD_REPOSITORY, useClass: UnidadPrismaRepository },
  { provide: USUARIO_REPOSITORY, useClass: UsuarioPrismaRepository },
];

const adapters = [
  { provide: AUDIT_LOGGER, useClass: AuditLoggerPrismaAdapter },
  { provide: MAIL_SENDER, useClass: GmailMailAdapter },
  { provide: VEHICULO_REGISTRY, useClass: VehiculoRegistryMockAdapter },
  // ── Flag: si EVENTS_ENABLED=true usa BullMQ, si no usa Noop (no hace nada) ──
  {
    provide: EVENT_PUBLISHER,
    useClass: eventsEnabled ? BullMqEventPublisherAdapter : NoopEventPublisherAdapter,
  },
];

const useCases = [
  {
    provide: AnularEncargoUseCase,
    useFactory: (encargoRepo, eventoRepo, usuarioRepo, eventPublisher) =>
      new AnularEncargoUseCase(encargoRepo, eventoRepo, usuarioRepo, eventPublisher),
    inject: [ENCARGO_REPOSITORY, EVENTO_DOMINIO_REPOSITORY, USUARIO_REPOSITORY, EVENT_PUBLISHER],
  },
  {
    provide: ConsultarEncargoUseCase,
    useFactory: (encargoRepo) =>
      new ConsultarEncargoUseCase(encargoRepo),
    inject: [ENCARGO_REPOSITORY],
  },
  {
    provide: ConsultarHallazgoUseCase,
    useFactory: (hallazgoRepo) =>
      new ConsultarHallazgoUseCase(hallazgoRepo),
    inject: [HALLAZGO_REPOSITORY],
  },
  {
    provide: ConciliarPlacaUseCase,
    useFactory: (encargoRepo, hallazgoRepo, reunificacionRepo, eventoRepo, eventPublisher) =>
      new ConciliarPlacaUseCase(encargoRepo, hallazgoRepo, reunificacionRepo, eventoRepo, eventPublisher),
    inject: [ENCARGO_REPOSITORY, HALLAZGO_REPOSITORY, REUNIFICACION_REPOSITORY, EVENTO_DOMINIO_REPOSITORY, EVENT_PUBLISHER],
  },
  {
    provide: EnviarNotificacionReunificacionUseCase,
    useFactory: (reunificacionRepo, encargoRepo, notificacionRepo, mailSender, hallazgoRepo, unidadRepo) =>
      new EnviarNotificacionReunificacionUseCase(reunificacionRepo, encargoRepo, notificacionRepo, mailSender, hallazgoRepo, unidadRepo),
    inject: [REUNIFICACION_REPOSITORY, ENCARGO_REPOSITORY, NOTIFICACION_REPOSITORY, MAIL_SENDER, HALLAZGO_REPOSITORY, UNIDAD_REPOSITORY],
  },
  {
    provide: ReintentarNotificacionesUseCase,
    useFactory: (notificacionRepo, mailSender) =>
      new ReintentarNotificacionesUseCase(notificacionRepo, mailSender),
    inject: [NOTIFICACION_REPOSITORY, MAIL_SENDER],
  },
  {
    provide: ProcesarLecturaUseCase,
    useFactory: (encargoRepo, eventoLecturaRepo, notificacionRepo, eventoRepo, mailSender, eventPublisher) =>
      new ProcesarLecturaUseCase(encargoRepo, eventoLecturaRepo, notificacionRepo, eventoRepo, mailSender, eventPublisher),
    inject: [ENCARGO_REPOSITORY, EVENTO_LECTURA_REPOSITORY, NOTIFICACION_REPOSITORY, EVENTO_DOMINIO_REPOSITORY, MAIL_SENDER, EVENT_PUBLISHER],
  },
  {
    provide: CerrarCasoUseCase,
    useFactory: (reunificacionRepo, encargoRepo, eventoRepo,usuarioRepo,  eventPublisher) =>
      new CerrarCasoUseCase(reunificacionRepo, encargoRepo, eventoRepo, usuarioRepo, eventPublisher),
    inject: [REUNIFICACION_REPOSITORY, ENCARGO_REPOSITORY, EVENTO_DOMINIO_REPOSITORY,USUARIO_REPOSITORY, EVENT_PUBLISHER],
  },
  {
    provide: ConsultarEstadoPlacaUseCase,
    useFactory: (encargoRepo, hallazgoRepo, reunificacionRepo) =>
      new ConsultarEstadoPlacaUseCase(encargoRepo, hallazgoRepo, reunificacionRepo),
    inject: [ENCARGO_REPOSITORY, HALLAZGO_REPOSITORY, REUNIFICACION_REPOSITORY],
  },
  {
    provide: ConsultarUnidadUseCase,
    useFactory: (unidadRepo) => new ConsultarUnidadUseCase(unidadRepo),
    inject: [UNIDAD_REPOSITORY],
  },
  // ── Refactorizado: sin EnviarNotificacionReunificacionUseCase ──
  // La notificación ahora la maneja el processor de BullMQ (patrón Observer)
  {
    provide: RegistrarEncargoUseCase,
    useFactory: (encargoRepo, eventoRepo, vehiculoRegistry, conciliar, hallazgoRepo, unidadRepo, usuarioRepo, eventPublisher) =>
      new RegistrarEncargoUseCase(encargoRepo, eventoRepo, vehiculoRegistry, conciliar, hallazgoRepo, unidadRepo, usuarioRepo, eventPublisher),
    inject: [
      ENCARGO_REPOSITORY,
      EVENTO_DOMINIO_REPOSITORY,
      VEHICULO_REGISTRY,
      ConciliarPlacaUseCase,
      HALLAZGO_REPOSITORY,
      UNIDAD_REPOSITORY,
      USUARIO_REPOSITORY,
      EVENT_PUBLISHER,
    ],
  },
  // ── Refactorizado: sin EnviarNotificacionReunificacionUseCase ──
  {
    provide: RegistrarHallazgoUseCase,
    useFactory: (hallazgoRepo, eventoRepo, conciliar, eventPublisher) =>
      new RegistrarHallazgoUseCase(hallazgoRepo, eventoRepo, conciliar, eventPublisher),
    inject: [
      HALLAZGO_REPOSITORY,
      EVENTO_DOMINIO_REPOSITORY,
      ConciliarPlacaUseCase,
      EVENT_PUBLISHER,
    ],
  },
  {
    provide: ExpirarEncargosUseCase,
    useFactory: (encargoRepo, eventoRepo) =>
      new ExpirarEncargosUseCase(encargoRepo, eventoRepo),
    inject: [ENCARGO_REPOSITORY, EVENTO_DOMINIO_REPOSITORY],
  },
];

// ── Imports condicionales: registrar cola BullMQ solo si está habilitado ──
const conditionalImports = eventsEnabled
  ? [BullModule.registerQueue({ name: 'sirepp-eventos' }), BullBoardConfigModule]
  : [];

// ── Strategy: handlers de eventos (solo si BullMQ está habilitado) ──
const eventHandlers = eventsEnabled
  ? [
    PlacaReunificadaHandler,
    PlacaLeidaHandler,
    EncargoAnuladoHandler,
    EncargoExpiradoHandler,
    CasoCerradoHandler,
    // ── Map de estrategias: asocia cada tipo de evento con su handler ──
    {
      provide: EVENTO_HANDLERS,
      useFactory: (
        placaReunificada: PlacaReunificadaHandler,
        placaLeida: PlacaLeidaHandler,
        encargoAnulado: EncargoAnuladoHandler,
        encargoExpirado: EncargoExpiradoHandler,
        casoCerrado: CasoCerradoHandler,
      ) => {
        const handlers = new Map<TipoEventoDominio, EventoHandler>();
        handlers.set(TipoEventoDominio.PLACA_REUNIFICADA, placaReunificada);
        handlers.set(TipoEventoDominio.PLACA_LEIDA, placaLeida);
        handlers.set(TipoEventoDominio.PLACA_ENCARGADA, new LogOnlyHandler('Placa encargada'));
        handlers.set(TipoEventoDominio.PLACA_HALLADA, new LogOnlyHandler('Placa hallada'));
        handlers.set(TipoEventoDominio.ENCARGO_ANULADO, encargoAnulado);
        handlers.set(TipoEventoDominio.ENCARGO_EXPIRADO, encargoExpirado);
        handlers.set(TipoEventoDominio.CASO_CERRADO, casoCerrado);
        return handlers;
      },
      inject: [
        PlacaReunificadaHandler,
        PlacaLeidaHandler,
        EncargoAnuladoHandler,
        EncargoExpiradoHandler,
        CasoCerradoHandler,
      ],
    },
  ]
  : [];

// ── Processor solo si está habilitado ──
const conditionalProviders = eventsEnabled
  ? [SireppEventosProcessor]
  : [];

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ...conditionalImports,
  ],
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
    UnidadMapper,
    UsuarioMapper,
    // Repositories, adapters y use cases
    ...repositories,
    ...adapters,
    ...useCases,
    // ── Strategy: handlers de eventos (solo si EVENTS_ENABLED=true) ──
    ...eventHandlers,
    // BullMQ processor (solo si EVENTS_ENABLED=true)
    ...conditionalProviders,
    // Scheduler
    EncargoExpirationService,
  ],
  exports: [
    ...repositories.map((r) => r.provide),
    ...adapters.map((a) => a.provide),
    ...useCases.map((u) => u.provide),
    AesCipherService,
  ],
})
export class InfrastructureModule {}