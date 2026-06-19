import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID, MinLength } from 'class-validator';

export class StartDirectConversationDto {
  @ApiProperty()
  @IsUUID()
  otherUserId: string;
}

export class CreateGroupConversationDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  participantIds: string[];
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  content: string;
}
