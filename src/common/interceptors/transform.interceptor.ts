import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  meta: {
    timestamp: string;
    [key: string]: any;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();

    return next.handle().pipe(
      map((data) => {
        // If the response is a redirect or already sent, return data as is
        if (
          response.headersSent ||
          response.statusCode === 302 ||
          response.statusCode === 301
        ) {
          return data;
        }

        // If the returned data is already wrapped in our format, return it directly
        if (
          data &&
          typeof data === 'object' &&
          'status' in data &&
          ('data' in data || 'error' in data)
        ) {
          return data;
        }

        let message = 'Request completed successfully';
        let returnData = data;

        // Extract custom message if returned inside an object
        if (data && typeof data === 'object' && 'message' in data) {
          message = data.message;
          const { message: _, ...rest } = data;
          returnData = rest;
        }

        const baseMeta = {
          timestamp: new Date().toISOString(),
        };

        // Support paginated return formats where both data and meta are returned
        if (
          returnData &&
          typeof returnData === 'object' &&
          'data' in returnData &&
          'meta' in returnData
        ) {
          return {
            status: 'success',
            message,
            data: returnData.data,
            meta: {
              ...baseMeta,
              ...returnData.meta,
            },
          };
        }

        return {
          status: 'success',
          message,
          data: returnData === undefined ? null : returnData,
          meta: baseMeta,
        };
      }),
    );
  }
}
