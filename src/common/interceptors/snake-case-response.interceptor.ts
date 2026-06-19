import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { toSnakeCaseResponse } from './snake-case.interceptor';

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => toSnakeCaseResponse(data)));
  }
}
