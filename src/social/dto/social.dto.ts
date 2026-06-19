import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SendFriendRequestDto {
  @ApiProperty()
  @IsUUID()
  recipientId: string;
}
