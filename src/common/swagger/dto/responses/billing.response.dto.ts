import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionSyncResponseDto {
  @ApiProperty({
    example: true,
    description: 'Statut premium après synchronisation avec RevenueCat',
  })
  is_premium: boolean;

  @ApiProperty({
    example: true,
    description: 'Indique si l\'abonnement premium est actif',
  })
  success: boolean;
}
