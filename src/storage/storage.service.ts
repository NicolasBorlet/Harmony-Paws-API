import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';

export const STORAGE_BUCKETS = [
  'users',
  'dogs',
  'rides',
  'formations',
  'modules',
  'documents',
  'user-badges',
] as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[number];

type StorageOperation = 'read' | 'write';

// Shared catalog content. Any authenticated user may download these objects,
// but uploads must never be issued through this API (managed via admin tooling).
const READ_ONLY_BUCKETS: ReadonlySet<StorageBucket> = new Set([
  'formations',
  'modules',
  'user-badges',
]);

// Whitelist of file extensions -> Content-Type pinned on the presigned PUT so an
// attacker cannot upload HTML/JS/SVG and have it served from the storage domain.
const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly publicEndpoint: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const endpoint = this.config.getOrThrow('MINIO_ENDPOINT');
    // Presigned URLs must target an address reachable by mobile clients, not the
    // internal Docker hostname (e.g. minio:9000). Signing is local — no S3 RPC.
    this.publicEndpoint =
      this.config.get('MINIO_PUBLIC_ENDPOINT') ?? endpoint;
    this.client = new S3Client({
      endpoint: this.publicEndpoint,
      region: this.config.get('MINIO_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.config.getOrThrow('MINIO_ACCESS_KEY'),
        secretAccessKey: this.config.getOrThrow('MINIO_SECRET_KEY'),
      },
      forcePathStyle: true,
    });
  }

  async getUploadUrl(bucket: string, key: string, userId: string) {
    const safeBucket = this.validateBucket(bucket);
    this.validateKey(key);
    if (READ_ONLY_BUCKETS.has(safeBucket)) {
      throw new ForbiddenException('This bucket is read-only');
    }
    await this.assertAccess(safeBucket, key, userId, 'write');
    const contentType = this.resolveContentType(safeBucket, key);
    const command = new PutObjectCommand({
      Bucket: safeBucket,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    return { url, bucket: safeBucket, key, contentType };
  }

  async getDownloadUrl(bucket: string, key: string, userId: string) {
    const safeBucket = this.validateBucket(bucket);
    this.validateKey(key);
    await this.assertAccess(safeBucket, key, userId, 'read');
    const command = new GetObjectCommand({ Bucket: safeBucket, Key: key });
    const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    return { url, bucket: safeBucket, key };
  }

  private validateBucket(bucket: string): StorageBucket {
    if (!STORAGE_BUCKETS.includes(bucket as StorageBucket)) {
      throw new BadRequestException('Unknown storage bucket');
    }
    return bucket as StorageBucket;
  }

  private validateKey(key: string): void {
    // Reject empty keys, path traversal, absolute paths and backslashes.
    if (
      !key ||
      key.includes('..') ||
      key.startsWith('/') ||
      key.includes('\\') ||
      key.includes('\0')
    ) {
      throw new BadRequestException('Invalid object key');
    }
  }

  private resolveContentType(bucket: StorageBucket, key: string): string {
    const ext = key.split('.').pop()?.toLowerCase() ?? '';
    const contentType = ALLOWED_CONTENT_TYPES[ext];
    if (!contentType) {
      throw new BadRequestException('Unsupported file type');
    }
    // Only the documents bucket may hold PDFs; image buckets must stay images.
    if (bucket !== 'documents' && contentType === 'application/pdf') {
      throw new BadRequestException('Unsupported file type for this bucket');
    }
    return contentType;
  }

  private async assertAccess(
    bucket: StorageBucket,
    key: string,
    userId: string,
    operation: StorageOperation,
  ) {
    // Shared catalog buckets: read allowed for any authenticated user, writes
    // are already blocked upstream in getUploadUrl.
    if (READ_ONLY_BUCKETS.has(bucket)) {
      if (operation === 'write') {
        throw new ForbiddenException('This bucket is read-only');
      }
      return;
    }

    if (bucket === 'users') {
      const targetUserId = key.replace(/\.(jpeg|jpg|png|webp)$/, '');
      if (targetUserId !== userId) {
        throw new ForbiddenException('Cannot access this user image');
      }
      return;
    }

    if (bucket === 'dogs') {
      const dogId = key.replace(/\.(jpeg|jpg|png|webp)$/, '');
      await this.assertDogOwner(dogId, userId, 'Cannot access this dog image');
      return;
    }

    if (bucket === 'rides') {
      const activityId = key.replace(/\.(jpeg|jpg|png|webp)$/, '');
      const activity = await this.prisma.activity.findFirst({
        where: {
          id: activityId,
          OR: [
            { creatorId: userId },
            { userActivities: { some: { userId } } },
          ],
        },
      });
      if (!activity) {
        throw new ForbiddenException('Cannot access this ride image');
      }
      return;
    }

    if (bucket === 'documents') {
      const segments = key.split('/');
      // Enforce a strict `{dogId}/{filename}` shape so the ownership check
      // cannot be bypassed with crafted keys.
      if (segments.length !== 2 || !segments[0] || !segments[1]) {
        throw new BadRequestException('Invalid document key');
      }
      await this.assertDogOwner(
        segments[0],
        userId,
        'Cannot access these documents',
      );
      return;
    }

    // Default deny for any bucket without an explicit access rule.
    throw new ForbiddenException('Access to this bucket is not allowed');
  }

  private async assertDogOwner(dogId: string, userId: string, message: string) {
    if (!this.isUuid(dogId)) {
      throw new BadRequestException('Invalid object key');
    }
    const dog = await this.prisma.dog.findFirst({
      where: { id: dogId, ownerId: userId },
    });
    if (!dog) throw new ForbiddenException(message);
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
