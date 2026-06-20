import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID, MinLength } from 'class-validator';

export class StartDirectConversationDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'UUID de l\'autre participant',
    format: 'uuid',
  })
  @IsUUID()
  otherUserId: string;
}

export class CreateGroupConversationDto {
  @ApiProperty({
    example: 'Groupe balade dimanche',
    description: 'Titre affiché dans la liste des conversations',
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440002',
      '550e8400-e29b-41d4-a716-446655440003',
    ],
    description: 'UUIDs des participants (hors utilisateur connecté)',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  participantIds: string[];
}

export class SendMessageDto {
  @ApiProperty({
    example: 'On se retrouve à 9h au parking !',
    description: 'Contenu textuel du message',
  })
  @IsString()
  @MinLength(1)
  content: string;
}
