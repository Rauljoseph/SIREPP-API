import { AuditLog } from '../entities';

export interface AuditLoggerPort {
  registrar(log: AuditLog): Promise<void>;
}

export const AUDIT_LOGGER = Symbol('AuditLoggerPort');