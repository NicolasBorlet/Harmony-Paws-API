import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export type ResendEmailPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
};

const BATCH_CHUNK_SIZE = 100;

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly client: Resend | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    this.client = apiKey ? new Resend(apiKey) : null;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async sendSingle(
    payload: ResendEmailPayload,
    idempotencyKey?: string,
  ): Promise<{ id: string }> {
    const client = this.requireClient();

    const { data, error } = await client.emails.send(
      {
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        replyTo: payload.replyTo,
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );

    if (error) {
      this.logger.error(`Resend send failed: ${error.message}`);
      throw new ServiceUnavailableException(
        'Impossible d\'envoyer l\'email pour le moment',
      );
    }

    return { id: data!.id };
  }

  async sendBatch(
    emails: ResendEmailPayload[],
    idempotencyKey?: string,
  ): Promise<{ ids: string[]; sentCount: number }> {
    const client = this.requireClient();

    if (emails.length === 0) {
      return { ids: [], sentCount: 0 };
    }

    const ids: string[] = [];

    for (let offset = 0; offset < emails.length; offset += BATCH_CHUNK_SIZE) {
      const chunk = emails.slice(offset, offset + BATCH_CHUNK_SIZE);
      const chunkKey =
        idempotencyKey && emails.length > BATCH_CHUNK_SIZE
          ? `${idempotencyKey}/chunk-${offset / BATCH_CHUNK_SIZE}`
          : idempotencyKey;

      const { data, error } = await client.batch.send(
        chunk.map((email) => ({
          from: email.from,
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          replyTo: email.replyTo,
        })),
        chunkKey ? { idempotencyKey: chunkKey } : undefined,
      );

      if (error) {
        this.logger.error(
          `Resend batch failed at offset ${offset}: ${error.message}`,
        );
        throw new ServiceUnavailableException(
          'Impossible d\'envoyer les emails pour le moment',
        );
      }

      for (const item of data?.data ?? []) {
        if (item.id) ids.push(item.id);
      }
    }

    return { ids, sentCount: ids.length };
  }

  private requireClient(): Resend {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Le service email n\'est pas configuré (RESEND_API_KEY manquant)',
      );
    }

    return this.client;
  }
}
