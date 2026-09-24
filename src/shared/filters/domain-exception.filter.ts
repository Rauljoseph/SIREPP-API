import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../domain/exceptions';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('DomainException');

  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const statusMap: Record<string, HttpStatus> = {
      PLACA_INVALIDA: HttpStatus.BAD_REQUEST,
      ENCARGO_NO_ENCONTRADO: HttpStatus.NOT_FOUND,
      HALLAZGO_NO_ENCONTRADO: HttpStatus.NOT_FOUND,
      ENCARGO_YA_REUNIFICADO: HttpStatus.CONFLICT,
    };

    const status = statusMap[exception.code] ?? HttpStatus.UNPROCESSABLE_ENTITY;

    this.logger.warn(`${exception.code}: ${exception.message}`);

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}