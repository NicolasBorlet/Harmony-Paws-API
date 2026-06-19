import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/utils/serialize';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertDogOwner(dogId: string, userId: string) {
    const dog = await this.prisma.dog.findFirst({
      where: { id: dogId, ownerId: userId },
    });
    if (!dog) throw new ForbiddenException('Not your dog');
    return dog;
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
    data: {
      fileName?: string;
      documentType: DocumentType;
      place?: string;
      reason?: string;
    },
  ) {
    await this.assertDogOwner(dogId, userId);
    const document = await this.prisma.document.create({
      data: { dogId, ...data },
    });
    return serialize(document);
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
