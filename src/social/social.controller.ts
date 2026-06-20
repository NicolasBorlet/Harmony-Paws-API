import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { SocialService } from './social.service';
import { SendFriendRequestDto } from './dto/social.dto';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import {
  FriendRequestResponseDto,
  FriendshipResponseDto,
  UserMeetingResponseDto,
} from '../common/swagger/dto/responses/activity-social.response.dto';

@ApiTags('social')
@Controller('social')
@UseGuards(JwtAuthGuard)
@ApiJwtAuth()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('friend-requests')
  @ApiOperation({
    summary: 'Lister les demandes d\'amitié',
    description: 'Demandes reçues et envoyées pour l\'utilisateur connecté.',
  })
  @ApiOkResponse({ type: [FriendRequestResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  listFriendRequests(@CurrentUser() user: AuthUser) {
    return this.socialService.listFriendRequests(user.id);
  }

  @Post('friend-requests')
  @ApiOperation({
    summary: 'Envoyer une demande d\'amitié',
    description: 'Crée une demande en statut `pending` vers `recipientId`.',
  })
  @ApiCreatedResponse({ type: FriendRequestResponseDto })
  @ApiStandardResponses({ unauthorized: true, conflict: true, notFound: true })
  sendFriendRequest(
    @CurrentUser() user: AuthUser,
    @Body() body: SendFriendRequestDto,
  ) {
    return this.socialService.sendFriendRequest(user.id, body.recipientId);
  }

  @Post('friend-requests/:id/accept')
  @ApiOperation({ summary: 'Accepter une demande d\'amitié' })
  @ApiParam({ name: 'id', description: 'Identifiant de la demande', example: '1' })
  @ApiOkResponse({ type: FriendshipResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  acceptFriendRequest(
    @Param('id', ParseBigIntPipe) id: bigint,
    @CurrentUser() user: AuthUser,
  ) {
    return this.socialService.acceptFriendRequest(id, user.id);
  }

  @Post('friend-requests/:id/reject')
  @ApiOperation({ summary: 'Refuser une demande d\'amitié' })
  @ApiParam({ name: 'id', description: 'Identifiant de la demande', example: '1' })
  @ApiNoContentResponse({ description: 'Demande refusée' })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  rejectFriendRequest(
    @Param('id', ParseBigIntPipe) id: bigint,
    @CurrentUser() user: AuthUser,
  ) {
    return this.socialService.rejectFriendRequest(id, user.id);
  }

  @Delete('friend-requests/:id')
  @ApiOperation({
    summary: 'Annuler une demande d\'amitié envoyée',
    description: 'Réservé à l\'expéditeur de la demande.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la demande', example: '1' })
  @ApiNoContentResponse({ description: 'Demande annulée' })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  cancelFriendRequest(
    @Param('id', ParseBigIntPipe) id: bigint,
    @CurrentUser() user: AuthUser,
  ) {
    return this.socialService.cancelFriendRequest(id, user.id);
  }

  @Get('friends')
  @ApiOperation({ summary: 'Lister mes amis' })
  @ApiOkResponse({ type: [FriendshipResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  listFriends(@CurrentUser() user: AuthUser) {
    return this.socialService.listFriends(user.id);
  }

  @Delete('friends/:friendId')
  @ApiOperation({ summary: 'Retirer un ami' })
  @ApiParam({
    name: 'friendId',
    description: 'UUID de l\'ami à retirer',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @ApiNoContentResponse({ description: 'Amitié supprimée' })
  @ApiStandardResponses({ unauthorized: true, notFound: true })
  removeFriend(
    @Param('friendId') friendId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.socialService.removeFriend(user.id, friendId);
  }

  @Get('meetings')
  @ApiOperation({
    summary: 'Historique des rencontres',
    description: 'Utilisateurs rencontrés lors de balades passées.',
  })
  @ApiOkResponse({ type: [UserMeetingResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  listMeetings(@CurrentUser() user: AuthUser) {
    return this.socialService.listMeetings(user.id);
  }
}
