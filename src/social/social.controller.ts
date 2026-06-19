import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { SocialService } from './social.service';
import { SendFriendRequestDto } from './dto/social.dto';

@ApiTags('social')
@Controller('social')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('friend-requests')
  listFriendRequests(@CurrentUser() user: AuthUser) {
    return this.socialService.listFriendRequests(user.id);
  }

  @Post('friend-requests')
  sendFriendRequest(
    @CurrentUser() user: AuthUser,
    @Body() body: SendFriendRequestDto,
  ) {
    return this.socialService.sendFriendRequest(user.id, body.recipientId);
  }

  @Post('friend-requests/:id/accept')
  acceptFriendRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.socialService.acceptFriendRequest(BigInt(id), user.id);
  }

  @Get('friends')
  listFriends(@CurrentUser() user: AuthUser) {
    return this.socialService.listFriends(user.id);
  }

  @Delete('friends/:friendId')
  removeFriend(
    @Param('friendId') friendId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.socialService.removeFriend(user.id, friendId);
  }

  @Get('meetings')
  listMeetings(@CurrentUser() user: AuthUser) {
    return this.socialService.listMeetings(user.id);
  }
}
