export type RevenueCatEventType =
  | 'TEST'
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'SUBSCRIPTION_PAUSED'
  | 'SUBSCRIPTION_EXTENDED'
  | 'TEMPORARY_ENTITLEMENT_GRANT'
  | 'REFUND_REVERSED'
  | 'TRANSFER';

export interface RevenueCatWebhookEvent {
  id: string;
  type: RevenueCatEventType;
  app_user_id: string;
  original_app_user_id?: string;
  aliases?: string[];
  entitlement_ids?: string[];
  product_id?: string;
  expiration_at_ms?: number;
  environment?: string;
}

export interface RevenueCatWebhookPayload {
  api_version: string;
  event: RevenueCatWebhookEvent;
}

export interface RevenueCatEntitlement {
  expires_date: string | null;
  grace_period_expires_date?: string | null;
  product_identifier: string;
  purchase_date: string;
}

export interface RevenueCatSubscriberResponse {
  request_date: string;
  request_date_ms: number;
  subscriber: {
    original_app_user_id: string;
    entitlements: Record<string, RevenueCatEntitlement>;
  };
}
