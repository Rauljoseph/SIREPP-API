import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { FuncionarioAutenticado } from './funcionario.decorator';

@Injectable()
export class AdministradorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<Request & { user?: FuncionarioAutenticado }>();
    if (user?.rol !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Esta operación requiere el rol de administrador.');
    }
    return true;
  }
}
