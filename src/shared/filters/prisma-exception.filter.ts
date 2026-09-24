import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('PrismaException');

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(`${exception.code}: ${exception.message}`);

    const { status, body } = this.mapError(exception);

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      ...body,
      timestamp: new Date().toISOString(),
    });
  }

  private mapError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    body: Record<string, unknown>;
  } {
    switch (exception.code) {
      // Unique constraint violation
      case 'P2002': {
        const campos = (exception.meta?.target as string[]) ?? [];
        return {
          status: HttpStatus.CONFLICT,
          body: {
            message: `Ya existe un registro con ese valor en: ${campos.join(', ')}`,
            campos,
          },
        };
      }

      // Foreign key constraint violation
      case 'P2003': {
        const campo = (exception.meta?.field_name as string) ?? 'desconocido';
        return {
          status: HttpStatus.BAD_REQUEST,
          body: {
            message: `Referencia inválida: el registro referenciado en '${campo}' no existe`,
            campo,
          },
        };
      }

      // Record not found
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          body: {
            message: 'El registro solicitado no fue encontrado',
          },
        };

      // Required field missing
      case 'P2011': {
        const campo = (exception.meta?.constraint as string) ?? 'desconocido';
        return {
          status: HttpStatus.BAD_REQUEST,
          body: {
            message: `Campo requerido faltante: ${campo}`,
            campo,
          },
        };
      }

      // Value too long
      case 'P2000': {
        const campo = (exception.meta?.column_name as string) ?? 'desconocido';
        return {
          status: HttpStatus.BAD_REQUEST,
          body: {
            message: `El valor es demasiado largo para el campo '${campo}'`,
            campo,
          },
        };
      }

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          body: {
            message: 'Error inesperado en la base de datos',
          },
        };
    }
  }
}