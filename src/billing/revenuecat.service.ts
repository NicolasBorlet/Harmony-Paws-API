import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  RevenueCatEntitlement,
  RevenueCatSubscriberResponse,
  RevenueCatWebhookEvent,
  RevenueCatWebhookPayload,
} from './revenuecat.types';

const PREMIUM_GRANT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'TEMPORARY_ENTITLEMENT_GRANT',
  'REFUND_REVERSED',
]);

const PREMIUM_REVOKE_EVENTS = new Set(['EXPIRATION']);

@Injectable()
export class RevenueCatService {
  private readonly logger = new Logger(RevenueCatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private getPremiumEntitlementId(): string {
    return this.config.get<string>(
      'REVENUECAT_PREMIUM_ENTITLEMENT_ID',
      'premium',
    );
  }

  verifyWebhookAuthorization(authHeader: string | undefined): void {
    const expected = this.config.get<string>('REVENUECAT_WEBHOOK_AUTHORIZATION');
    if (!expected) {
      this.logger.warn(
        'REVENUECAT_WEBHOOK_AUTHORIZATION is not set — webhook auth skipped',
      );
      return;
    }
    if (authHeader !== expected) {
      throw new UnauthorizedException('Invalid webhook authorization');
    }
  }

  private shouldGrantPremium(event: RevenueCatWebhookEvent): boolean {
    const premiumEntitlementId = this.getPremiumEntitlementId();
    const ids = event.entitlement_ids;

    if (!ids?.length) {
      this.logger.warn(
        `Webhook ${event.type}: entitlement_ids is empty — granting premium (map your product to entitlement "${premiumEntitlementId}" in RevenueCat)`,
      );
      return true;
    }

    if (ids.includes(premiumEntitlementId)) {
      return true;
    }

    this.logger.warn(
      `Webhook ${event.type}: entitlement_ids=[${ids.join(', ')}] does not include "${premiumEntitlementId}" — granting premium (update REVENUECAT_PREMIUM_ENTITLEMENT_ID if needed)`,
    );
    return true;
  }

  private shouldRevokePremium(event: RevenueCatWebhookEvent): boolean {
    const premiumEntitlementId = this.getPremiumEntitlementId();
    const ids = event.entitlement_ids;

    if (!ids?.length) return true;
    return ids.includes(premiumEntitlementId);
  }

  async handleWebhook(payload: RevenueCatWebhookPayload): Promise<void> {
    const { event } = payload;

    if (event.type === 'TEST') {
      this.logger.log('Received RevenueCat TEST webhook');
      return;
    }

    const userId = await this.resolveUserId(event.app_user_id, event.aliases);
    if (!userId) {
      this.logger.warn(
        `RevenueCat webhook: no user found for app_user_id=${event.app_user_id}`,
      );
      return;
    }

    const customerId = event.original_app_user_id ?? event.app_user_id;

    if (PREMIUM_GRANT_EVENTS.has(event.type) && this.shouldGrantPremium(event)) {
      await this.setPremium(userId, customerId, true);
      this.logger.log(
        `Premium granted for user ${userId} (${event.type})`,
      );
      return;
    }

    if (PREMIUM_REVOKE_EVENTS.has(event.type) && this.shouldRevokePremium(event)) {
      await this.setPremium(userId, customerId, false);
      this.logger.log(
        `Premium revoked for user ${userId} (${event.type})`,
      );
      return;
    }

    this.logger.debug(
      `RevenueCat webhook ignored: type=${event.type}, user=${userId}`,
    );
  }

  async syncSubscription(userId: string): Promise<{ isPremium: boolean }> {
    const apiKey = this.config.get<string>('REVENUECAT_API_SECRET_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'RevenueCat API key is not configured',
      );
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    };

    if (this.config.get<string>('NODE_ENV') !== 'production') {
      headers['X-Is-Sandbox'] = 'true';
    }

    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
      { headers },
    );

    if (!response.ok) {
      this.logger.error(
        `RevenueCat API error: ${response.status} ${response.statusText}`,
      );
      throw new InternalServerErrorException(
        'Failed to verify subscription with RevenueCat',
      );
    }

    const data = (await response.json()) as RevenueCatSubscriberResponse;
    const premiumEntitlementId = this.getPremiumEntitlementId();
    const configuredEntitlement =
      data.subscriber.entitlements[premiumEntitlementId];
    const isPremium =
      this.isEntitlementActive(configuredEntitlement, data.request_date_ms) ||
      this.hasAnyActiveEntitlement(data);
    const customerId = data.subscriber.original_app_user_id ?? userId;

    await this.setPremium(userId, customerId, isPremium);

    return { isPremium };
  }

  private isEntitlementActive(
    entitlement: RevenueCatEntitlement | undefined,
    requestDateMs: number,
  ): boolean {
    if (!entitlement) return false;

    const expiresDate = entitlement.expires_date;
    if (!expiresDate) return true;

    const gracePeriodExpires = entitlement.grace_period_expires_date;
    const referenceMs = requestDateMs;
    const expiresMs = Date.parse(expiresDate);
    if (Number.isNaN(expiresMs)) return false;
    if (expiresMs > referenceMs) return true;

    if (gracePeriodExpires) {
      const graceMs = Date.parse(gracePeriodExpires);
      return !Number.isNaN(graceMs) && graceMs > referenceMs;
    }

    return false;
  }

  private hasAnyActiveEntitlement(
    data: RevenueCatSubscriberResponse,
  ): boolean {
    return Object.values(data.subscriber.entitlements).some((entitlement) =>
      this.isEntitlementActive(entitlement, data.request_date_ms),
    );
  }

  private async resolveUserId(
    appUserId: string,
    aliases?: string[],
  ): Promise<string | null> {
    const candidates = [appUserId, ...(aliases ?? [])];
    for (const id of candidates) {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });
      if (user) return user.id;
    }
    return null;
  }

  private async setPremium(
    userId: string,
    customerId: string,
    isPremium: boolean,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isPremium, customerId },
    });
  }
}
