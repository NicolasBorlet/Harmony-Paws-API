import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { serialize } from '../common/utils/serialize';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { HealthDocumentMimeType } from './dto/health.dto';

const MIME_TO_EXTENSION: Record<HealthDocumentMimeType, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async assertDogOwner(dogId: string, userId: string) {
    const dog = await this.prisma.dog.findFirst({
      where: { id: dogId, ownerId: userId },
    });
    if (!dog) throw new ForbiddenException('Not your dog');
    return dog;
  }

  private mimeToExtension(mimeType: HealthDocumentMimeType): string {
    return MIME_TO_EXTENSION[mimeType];
  }

  async listVaccinations(dogId: string, userId: string) {
    await this.assertDogOwner(dogId, userId);
    return serialize(
      await this.prisma.vaccination.findMany({
        where: { dogId },
        orderBy: { date: 'desc' },
      }),
    );
  }

  async createVaccination(
    dogId: string,
    userId: string,
    data: { name: string; date: string },
  ) {
    await this.assertDogOwner(dogId, userId);
    const vaccination = await this.prisma.vaccination.create({
      data: { dogId, name: data.name, date: new Date(data.date) },
    });
    return serialize(vaccination);
  }

  async listMeasurements(dogId: string, userId: string) {
    await this.assertDogOwner(dogId, userId);
    return serialize(
      await this.prisma.dogMeasurement.findMany({
        where: { dogId },
        orderBy: { date: 'desc' },
      }),
    );
  }

  async createMeasurement(
    dogId: string,
    userId: string,
    data: { date: string; height?: number; weight?: number },
  ) {
    await this.assertDogOwner(dogId, userId);
    const measurement = await this.prisma.dogMeasurement.create({
      data: {
        dogId,
        date: new Date(data.date),
        height: data.height,
        weight: data.weight,
      },
    });
    return serialize(measurement);
  }

  async listDocuments(dogId: string, userId: string) {
    await this.assertDogOwner(dogId, userId);
    return serialize(
      await this.prisma.document.findMany({
        where: { dogId },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async createDocument(
    dogId: string,
    userId: string,
    user: AuthUser,
    data: {
      fileName?: string;
      documentType: DocumentType;
      place?: string;
      reason?: string;
      mimeType: HealthDocumentMimeType;
    },
  ) {
    await this.assertDogOwner(dogId, userId);
    const extension = this.mimeToExtension(data.mimeType);

    const created = await this.prisma.document.create({
      data: {
        dogId,
        fileName: data.fileName,
        documentType: data.documentType,
        place: data.place,
        reason: data.reason,
        mimeType: data.mimeType,
      },
    });

    const storageKey = `${created.id}.${extension}`;
    const document = await this.prisma.document.update({
      where: { id: created.id },
      data: { storageKey },
    });

    const objectKey = `${dogId}/${storageKey}`;
    const { url } = await this.storage.getUploadUrl(
      'documents',
      objectKey,
      user,
    );

    return serialize({ document, uploadUrl: url });
  }

  async finalizeDocument(dogId: string, documentId: bigint, userId: string) {
    await this.assertDogOwner(dogId, userId);
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, dogId },
    });
    if (!document) throw new NotFoundException('Document not found');
    if (!document.storageKey) {
      throw new UnprocessableEntityException('Document storage key is missing');
    }

    const objectKey = `${dogId}/${document.storageKey}`;
    const fileExists = await this.storage.objectExists('documents', objectKey);
    if (!fileExists) {
      await this.prisma.document.delete({ where: { id: documentId } });
      throw new UnprocessableEntityException('Document file is required');
    }

    return serialize(document);
  }

  async deleteDocument(documentId: bigint, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { dog: true },
    });
    if (!document) throw new NotFoundException('Document not found');
    if (document.dog.ownerId !== userId) {
      throw new ForbiddenException('Not your dog');
    }

    if (document.storageKey) {
      await this.storage.deleteObject(
        'documents',
        `${document.dogId}/${document.storageKey}`,
      );
    }

    await this.prisma.document.delete({ where: { id: documentId } });
    return { success: true };
  }

  async listReminders(dogId: string, userId: string) {
    await this.assertDogOwner(dogId, userId);
    return serialize(
      await this.prisma.healthReminder.findMany({
        where: { dogId },
        orderBy: { date: 'asc' },
      }),
    );
  }

  async createReminder(
    dogId: string,
    userId: string,
    data: { title: string; date: string; notes?: string },
  ) {
    await this.assertDogOwner(dogId, userId);
    const reminder = await this.prisma.healthReminder.create({
      data: {
        dogId,
        title: data.title,
        date: new Date(data.date),
        notes: data.notes,
      },
    });
    return serialize(reminder);
  }

  async updateReminder(
    reminderId: bigint,
    userId: string,
    data: Partial<{ title: string; date: string; notes: string }>,
  ) {
    const reminder = await this.prisma.healthReminder.findUnique({
      where: { id: reminderId },
      include: { dog: true },
    });
    if (!reminder) throw new NotFoundException('Reminder not found');
    if (reminder.dog.ownerId !== userId) {
      throw new ForbiddenException('Not your dog');
    }
    const updated = await this.prisma.healthReminder.update({
      where: { id: reminderId },
      data: {
        title: data.title,
        notes: data.notes,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
    return serialize(updated);
  }

  async deleteReminder(reminderId: bigint, userId: string) {
    const reminder = await this.prisma.healthReminder.findUnique({
      where: { id: reminderId },
      include: { dog: true },
    });
    if (!reminder) throw new NotFoundException('Reminder not found');
    if (reminder.dog.ownerId !== userId) {
      throw new ForbiddenException('Not your dog');
    }
    await this.prisma.healthReminder.delete({ where: { id: reminderId } });
    return { success: true };
  }
}
