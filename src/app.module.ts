import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { InterfacesModule } from './interfaces/http/interfaces.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { PrismaExceptionFilter } from './shared/filters/prisma-exception.filter';
import { DomainExceptionFilter } from './shared/filters/domain-exception.filter';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor';

import { AuthController } from './shared/auth/auth.controller';
import { KeycloakGuard } from './shared/auth/keycloak.guard';
import { KeycloakStrategy } from './shared/auth/keycloak.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'keycloak', session: false }),
    InfrastructureModule,
    InterfacesModule,
  ],
  controllers: [AuthController],
  providers: [
    KeycloakStrategy,
    { provide: APP_GUARD, useClass: KeycloakGuard },
    // Orden importa: el más específico primero, el catch-all al final
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
