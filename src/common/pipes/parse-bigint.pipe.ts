import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

/**
 * Safely converts a route parameter into a `bigint`. Without this, a non-numeric
 * value reaching `BigInt(value)` throws a `SyntaxError` that surfaces as an
 * unhandled 500 instead of a clean 400.
 */
@Injectable()
export class ParseBigIntPipe implements PipeTransform<string, bigint> {
  transform(value: string, _metadata: ArgumentMetadata): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('Parameter must be a positive integer');
    }
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException('Parameter must be a positive integer');
    }
  }
}
