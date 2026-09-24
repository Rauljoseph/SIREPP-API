import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalException');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Si ya es un HttpException de NestJS, respetar su status
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      response.status(status).json({
        statusCode: status,
        ...(typeof body === 'string' ? { message: body } : (body as object)),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Error genérico de dominio (los throw new Error() de los use cases)
    if (exception instanceof Error) {
      this.logger.error(`${exception.message}`, exception.stack);

      // Mapear mensajes conocidos de los use cases a HTTP status
      const status = this.inferirStatus(exception.message);

      response.status(status).json({
        statusCode: status,
        message: exception.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Algo completamente desconocido
    this.logger.error('Error no identificado', exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
      timestamp: new Date().toISOString(),
    });
  }

  private inferirStatus(message: string): number {
    if (message.includes('no encontrad')) return HttpStatus.NOT_FOUND;
    if (message.includes('Ya existe')) return HttpStatus.CONFLICT;
    if (message.includes('no puede')) return HttpStatus.UNPROCESSABLE_ENTITY;
    if (message.includes('no puede anularse')) return HttpStatus.UNPROCESSABLE_ENTITY;
    if (message.includes('no puede cerrarse')) return HttpStatus.UNPROCESSABLE_ENTITY;
    if (message.includes('no puede reunificarse')) return HttpStatus.UNPROCESSABLE_ENTITY;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}