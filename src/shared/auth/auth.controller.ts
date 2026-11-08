import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('api/auth')
export class AuthController {
  @Get('session')
  @HttpCode(HttpStatus.NO_CONTENT)
  verificarSesion(): void {}
}
