import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// The empty @Catch() decorator tells NestJS to catch EVERY unhandled error
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  // We use the built-in NestJS Logger for beautifully formatted console outputs
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine if it's a known NestJS error (like 404 Not Found) or an unknown crash (500)
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Get the standard error message, or fallback to a safe generic message
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // LOGGING LOGIC: If it's a 500 error, log the full stack trace to your terminal
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      const errorMessage =
        exception instanceof Error ? exception.message : 'Unknown Error';
      const errorStack = exception instanceof Error ? exception.stack : '';

      this.logger.error(
        `Critical Error on [${request.method}] ${request.url} - ${errorMessage}`,
        errorStack,
      );
    }

    // THE USER RESPONSE: A standardized, safe JSON response that never leaks DB details
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof message === 'string'
          ? message
          : (message as any).message || message,
    });
  }
}
