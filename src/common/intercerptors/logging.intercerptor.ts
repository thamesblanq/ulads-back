import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express'; // 1. Import explicit Express types
import { db } from '@/config/database';

// 2. Explicitly define the shape of the data Passport attaches to the request
interface AuthenticatedUser {
  sub: string;
  email: string;
  role?: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // strictly typed return
    const ctx = context.switchToHttp();

    // 3. Cast the Request and Response to their strict Express types
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, ip } = request;
    const startTime = Date.now();

    // The statusCode parameter is now strictly enforced as a number
    const logRequest = async (statusCode: number) => {
      const responseTime = Date.now() - startTime;

      // 4. Safely cast the user object so TypeScript knows exactly what properties exist
      const user = request.user as AuthenticatedUser | undefined;
      const userId = user?.sub;
      const userEmail = user?.email;
      // NEW: Grab the role and format it elegantly (e.g., "|ADMIN")
      const userRole = user?.role ? `|${user.role.toUpperCase()}` : '';
      // NEW: The display string will now look like "User:student@ulads.edu|SUPERADMIN"
      const displayUser = userEmail ? `User:${userEmail}${userRole}` : 'Guest';

      this.logger.log(
        `[${displayUser}] ${method} ${url} ${statusCode} - ${responseTime}ms - IP: ${ip}`,
      );

      try {
        const query = `
          INSERT INTO activity_logs (user_id, method, url, status_code, response_time_ms, ip_address)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await db.query(query, [
          userId || null,
          method,
          url,
          statusCode,
          responseTime,
          ip,
        ]);
      } catch (dbError) {
        this.logger.error('Failed to save log to database', dbError);
      }
    };

    return next.handle().pipe(
      tap(async () => {
        // response.statusCode is guaranteed to be a number now because of the <Response> cast
        await logRequest(response.statusCode);
      }),
      catchError((err: unknown) => {
        // 5. Force the error to be handled strictly
        // Safely check if the error is a NestJS HttpException to extract the number
        const statusCode = err instanceof HttpException ? err.getStatus() : 500;

        logRequest(statusCode).catch((e) =>
          this.logger.error('Logging failed', e),
        );

        return throwError(() => err);
      }),
    );
  }
}
