function toSnakeCaseKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function transformKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(transformKeys);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        toSnakeCaseKey(k),
        transformKeys(v),
      ]),
    );
  }
  return value;
}

export function toSnakeCaseResponse<T>(data: T): T {
  return transformKeys(data) as T;
}
