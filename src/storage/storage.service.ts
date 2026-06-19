import { ForbiddenException, Injectable } from '@nestjs/common';
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

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly publicEndpoint: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const endpoint = this.config.getOrThrow('MINIO_ENDPOINT');
    this.publicEndpoint =
      this.config.get('MINIO_PUBLIC_ENDPOINT') ?? endpoint;
    this.client = new S3Client({
      endpoint,
      region: this.config.get('MINIO_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.config.getOrThrow('MINIO_ACCESS_KEY'),
        secretAccessKey: this.config.getOrThrow('MINIO_SECRET_KEY'),
      },
      forcePathStyle: true,
    });
  }

  async getUploadUrl(bucket: StorageBucket, key: string, userId: string) {
    await this.assertAccess(bucket, key, userId);
    const command = new PutObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    return { url, bucket, key };
  }

  async getDownloadUrl(bucket: StorageBucket, key: string, userId: string) {
    await this.assertAccess(bucket, key, userId);
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    return { url, bucket, key };
  }

  private async assertAccess(
    bucket: StorageBucket,
    key: string,
    userId: string,
  ) {
    if (bucket === 'users') {
      const targetUserId = key.replace(/\.jpeg$/, '');
      if (targetUserId !== userId) {
        throw new ForbiddenException('Cannot access this user image');
      }
      return;
    }

    if (bucket === 'dogs') {
      const dogId = key.replace(/\.jpeg$/, '');
      const dog = await this.prisma.dog.findFirst({
        where: { id: dogId, ownerId: userId },
      });
      if (!dog) throw new ForbiddenException('Cannot access this dog image');
      return;
    }

    if (bucket === 'rides') {
      const activityId = key.replace(/\.jpeg$/, '');
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
      const dogId = key.split('/')[0];
      const dog = await this.prisma.dog.findFirst({
        where: { id: dogId, ownerId: userId },
      });
      if (!dog) throw new ForbiddenException('Cannot access these documents');
    }
  }
}
