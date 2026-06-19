import { Prisma } from '@prisma/client';

export function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) =>
      typeof v === 'bigint' ? v.toString() : v,
    ),
  ) as T;
}

export function decimalToNumber(
  value: Prisma.Decimal | null | undefined,
): number | null {
  if (value == null) return null;
  return value.toNumber();
}
