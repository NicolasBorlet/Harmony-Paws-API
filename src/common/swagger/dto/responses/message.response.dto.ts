import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConversationResponseDto {
  @ApiProperty({ example: '1', description: 'Identifiant BigInt sérialisé' })
  id: string;

  @ApiPropertyOptional({ example: 'Groupe balade dimanche' })
  title?: string | null;

  @ApiProperty({ example: '2026-06-19T08:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-06-19T10:00:00.000Z' })
  updated_at: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: '42' })
  id: string;

  @ApiProperty({ example: '1' })
  conversation_id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  sender_id: string;

  @ApiProperty({ example: 'On se retrouve à 9h au parking !' })
  content: string;

  @ApiProperty({ example: false })
  is_read: boolean;

  @ApiProperty({ example: '2026-06-19T09:30:00.000Z' })
  created_at: string;
}

export class LastMessagePreviewDto {
  @ApiProperty({ example: '1' })
  conversation_id: string;

  @ApiPropertyOptional({ type: MessageResponseDto })
  last_message?: MessageResponseDto | null;
}
