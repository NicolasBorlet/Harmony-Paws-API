import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import { SubscriptionSyncResponseDto } from '../common/swagger/dto/responses/billing.response.dto';
import { RevenueCatService } from './revenuecat.service';

@ApiTags('billing')
@Controller('subscriptions')
export class BillingController {
  constructor(private readonly revenueCatService: RevenueCatService) {}

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Synchroniser le statut premium',
    description:
      'Interroge RevenueCat pour le statut d\'abonnement de l\'utilisateur connecté, met à jour `is_premium` en base, et retourne le résultat. À appeler après un achat via le SDK mobile, puis refetch `GET /users/me`.',
  })
  @ApiOkResponse({ type: SubscriptionSyncResponseDto })
  @ApiStandardResponses({ unauthorized: true })
  async sync(@CurrentUser() user: AuthUser) {
    const { isPremium } = await this.revenueCatService.syncSubscription(
      user.id,
    );
    return { is_premium: isPremium, success: isPremium };
  }
}
