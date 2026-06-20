import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { MessagesService } from './messages.service';
import {
  CreateGroupConversationDto,
  SendMessageDto,
  StartDirectConversationDto,
} from './dto/messages.dto';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import {
  ConversationResponseDto,
  LastMessagePreviewDto,
  MessageResponseDto,
} from '../common/swagger/dto/responses/message.response.dto';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiJwtAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @ApiOperation({
    summary: 'Lister mes conversations',
    description: 'Conversations directes et groupes dont l\'utilisateur est participant.',
  })
  @ApiOkResponse({ type: [ConversationResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  listConversations(@CurrentUser() user: AuthUser) {
    return this.messagesService.listConversations(user.id);
  }

  @Get('conversations/last-messages')
  @ApiOperation({
    summary: 'Aperçu du dernier message par conversation',
    description: 'Optimisé pour l\'écran liste de chats.',
  })
  @ApiOkResponse({ type: [LastMessagePreviewDto] })
  @ApiStandardResponses({ unauthorized: true })
  lastMessages(@CurrentUser() user: AuthUser) {
    return this.messagesService.getLastMessagesForConversations(user.id);
  }

  @Post('conversations/direct')
  @ApiOperation({
    summary: 'Démarrer ou rouvrir une conversation directe',
    description: 'Idempotent : retourne la conversation existante si déjà créée.',
  })
  @ApiCreatedResponse({ type: ConversationResponseDto })
  @ApiStandardResponses({ unauthorized: true, notFound: true })
  startDirect(
    @CurrentUser() user: AuthUser,
    @Body() body: StartDirectConversationDto,
  ) {
    return this.messagesService.startDirectConversation(user.id, body.otherUserId);
  }

  @Post('conversations/group')
  @ApiOperation({
    summary: 'Créer une conversation de groupe',
    description: 'L\'utilisateur connecté est automatiquement ajouté comme participant.',
  })
  @ApiCreatedResponse({ type: ConversationResponseDto })
  @ApiStandardResponses({ unauthorized: true })
  createGroup(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateGroupConversationDto,
  ) {
    return this.messagesService.createGroupConversation(
      user.id,
      body.title,
      body.participantIds,
    );
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Historique des messages d\'une conversation' })
  @ApiParam({
    name: 'id',
    description: 'Identifiant numérique de la conversation',
    example: '1',
  })
  @ApiOkResponse({ type: [MessageResponseDto] })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  getMessages(
    @Param('id', ParseBigIntPipe) id: bigint,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messagesService.getMessages(id, user.id);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Envoyer un message' })
  @ApiParam({ name: 'id', description: 'Identifiant de la conversation', example: '1' })
  @ApiCreatedResponse({ type: MessageResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  sendMessage(
    @Param('id', ParseBigIntPipe) id: bigint,
    @CurrentUser() user: AuthUser,
    @Body() body: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(id, user.id, body.content);
  }
}
