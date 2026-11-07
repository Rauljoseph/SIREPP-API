import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { AuditLog } from '../../domain/entities';
import { AuditLoggerPort, AUDIT_LOGGER } from '../../domain/ports';

import type { FuncionarioAutenticado } from '../auth/funcionario.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Inject(AUDIT_LOGGER)
    private readonly auditLogger: AuditLoggerPort,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: FuncionarioAutenticado }>();
    const method = request.method;
    const path = request.path;
    const ip = request.ip ?? '0.0.0.0';
    const userAgent = request.headers['user-agent'] ?? null;

    // Solo auditar operaciones que modifican datos
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const funcionario = request.user;
    if (!funcionario) return next.handle();
    const accion = this.mapMetodoAAccion(method);

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const entidadId =
            (response as any)?.id ?? request.params?.id ?? null;

          const log = AuditLog.crear({

            usuarioId: funcionario.id,
            accion,
            entidad: this.extraerEntidad(path),
            entidadId,
            detalle: { method, path, body: this.sanitizarBody(request.body) },
            ip,
            userAgent: userAgent ?? undefined,
          });

          await this.auditLogger.registrar(log);
        } catch {
          // El audit no debe romper la operación
        }
      }),
    );
  }

  private mapMetodoAAccion(method: string): string {
    const mapa: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return mapa[method] ?? method;
  }

  private extraerEntidad(path: string): string {
    // /api/encargos/123 → encargo
    const segmentos = path.split('/').filter(Boolean);
    const recurso = segmentos.find((s) =>
      ['encargos', 'hallazgos', 'reunificaciones', 'notificaciones', 'lecturas'].includes(s),
    );
    return recurso?.replace(/s$/, '') ?? 'desconocido';
  }

  private sanitizarBody(body: Record<string, unknown>): Record<string, unknown> {
    if (!body) return {};
    const copia = { ...body };
    // Nunca registrar datos personales en el audit
    const sensibles = ['denuncianteRut', 'denuncianteNombre', 'denuncianteEmail', 'receptorRut'];
    for (const campo of sensibles) {
      if (campo in copia) {
        copia[campo] = '***';
      }
    }
    return copia;
  }
}