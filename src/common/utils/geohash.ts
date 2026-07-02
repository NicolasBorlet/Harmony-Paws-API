const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encodeGeohash(
  latitude: number,
  longitude: number,
  precision = 6,
): string {
  let isEven = true;
  let bit = 0;
  let ch = 0;
  let geohash = '';

  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;

  while (geohash.length < precision) {
    const mid = isEven ? (lonMin + lonMax) / 2 : (latMin + latMax) / 2;
    const value = isEven ? longitude : latitude;

    if (value >= mid) {
      ch = (ch << 1) + 1;
      if (isEven) lonMin = mid;
      else latMin = mid;
    } else {
      ch = ch << 1;
      if (isEven) lonMax = mid;
      else latMax = mid;
    }

    isEven = !isEven;
    bit += 1;

    if (bit === 5) {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

export function geohashCommonPrefixLength(
  geohash: string | null | undefined,
  reference: string,
): number {
  if (!geohash) return 0;
  let i = 0;
  const max = Math.min(geohash.length, reference.length);
  while (i < max && geohash[i] === reference[i]) i++;
  return i;
}
