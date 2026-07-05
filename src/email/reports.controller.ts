import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import { ApiErrorResponseDto } from '../common/swagger/dto/api-error.dto';
import {
  ContactReportDto,
  DogReportDto,
  EmailSentResponseDto,
  RideBugReportDto,
  UserReportDto,
} from './dto/email.dto';
import { EmailService } from './email.service';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiJwtAuth()
export class ReportsController {
  constructor(private readonly emailService: EmailService) {}

  @Post('ride-bug')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Signaler un bug pendant une balade',
    description:
      'Envoie un email au support avec le contexte de la balade. Limité à **5 requêtes/minute**.',
  })
  @ApiCreatedResponse({ type: EmailSentResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  @ApiStandardResponses({ unauthorized: true, tooManyRequests: true })
  reportRideBug(
    @CurrentUser() user: AuthUser,
    @Body() dto: RideBugReportDto,
  ) {
    return this.emailService.sendRideBugReport(user.id, dto);
  }

  @Post('user')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Signaler un utilisateur',
    description:
      'Envoie un signalement au support. Limité à **5 requêtes/minute**.',
  })
  @ApiCreatedResponse({ type: EmailSentResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  @ApiStandardResponses({
    unauthorized: true,
    notFound: true,
    tooManyRequests: true,
  })
  reportUser(@CurrentUser() user: AuthUser, @Body() dto: UserReportDto) {
    return this.emailService.sendUserReport(user.id, dto);
  }

  @Post('dog')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Signaler un chien',
    description:
      'Envoie un signalement au support. Limité à **5 requêtes/minute**.',
  })
  @ApiCreatedResponse({ type: EmailSentResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  @ApiStandardResponses({
    unauthorized: true,
    notFound: true,
    tooManyRequests: true,
  })
  reportDog(@CurrentUser() user: AuthUser, @Body() dto: DogReportDto) {
    return this.emailService.sendDogReport(user.id, dto);
  }

  @Post('contact')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Contact divers',
    description:
      'Message libre vers le support. Limité à **5 requêtes/minute**.',
  })
  @ApiCreatedResponse({ type: EmailSentResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  @ApiStandardResponses({ unauthorized: true, tooManyRequests: true })
  contact(@CurrentUser() user: AuthUser, @Body() dto: ContactReportDto) {
    return this.emailService.sendContactReport(user.id, dto);
  }
}
