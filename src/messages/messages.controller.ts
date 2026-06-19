import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import {
  CreateGroupConversationDto,
  SendMessageDto,
  StartDirectConversationDto,
} from './dto/messages.dto';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthUser) {
    return this.messagesService.listConversations(user.id);
  }

  @Get('conversations/last-messages')
  lastMessages(@CurrentUser() user: AuthUser) {
    return this.messagesService.getLastMessagesForConversations(user.id);
  }

  @Post('conversations/direct')
  startDirect(
    @CurrentUser() user: AuthUser,
    @Body() body: StartDirectConversationDto,
  ) {
    return this.messagesService.startDirectConversation(user.id, body.otherUserId);
  }

  @Post('conversations/group')
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
  getMessages(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messagesService.getMessages(BigInt(id), user.id);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(BigInt(id), user.id, body.content);
  }
}
