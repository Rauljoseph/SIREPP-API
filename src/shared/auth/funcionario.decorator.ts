import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { KeycloakStrategy } from './keycloak.strategy';

export type FuncionarioAutenticado = Awaited<ReturnType<KeycloakStrategy['validate']>>;

export const Funcionario = createParamDecorator(
  (_: unknown, context: ExecutionContext): FuncionarioAutenticado =>
    context.switchToHttp().getRequest<Request & { user: FuncionarioAutenticado }>().user,
);
