import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

const ROL_MAP: Record<string, string> = {
  ADMINISTRADOR: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  CONSULTA: 'FUNCIONARIO',
  GUARDIA: 'GUARDIA',
};

@Controller('api/auth')
export class AuthController {
  @Get('session')
  verificarSesion(@Req() req: Request) {
    const user = req.user as { id: string; rol: string; unidadId: string };
    return {
      id: user.id,
      rol: ROL_MAP[user.rol] ?? user.rol,
      unidadId: user.unidadId,
    };
  }
}