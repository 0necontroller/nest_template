import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody: any = exception.getResponse();

      message =
        typeof resBody === 'string'
          ? resBody
          : resBody.message || exception.message;

      // Map standard HTTP Status codes to error codes
      switch (status) {
        case HttpStatus.BAD_REQUEST:
          code = 'BAD_REQUEST';
          // Check for class-validator errors
          if (resBody && Array.isArray(resBody.message)) {
            code = 'VALIDATION_FAILED';
            message = 'Validation failed';
            details = resBody.message.map((msg: string) => {
              const firstWord = msg.split(' ')[0] || 'field';
              return {
                field: firstWord,
                issue: msg,
              };
            });
          }
          break;
        case HttpStatus.UNAUTHORIZED:
          code = 'UNAUTHORIZED';
          break;
        case HttpStatus.FORBIDDEN:
          code = 'FORBIDDEN';
          break;
        case HttpStatus.NOT_FOUND:
          code = 'NOT_FOUND';
          break;
        case HttpStatus.CONFLICT:
          code = 'CONFLICT';
          break;
        default:
          code = 'HTTP_ERROR';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      status: 'error',
      message,
      error: {
        code,
        message,
        details: details.length > 0 ? details : undefined,
      },
    });
  }
}
