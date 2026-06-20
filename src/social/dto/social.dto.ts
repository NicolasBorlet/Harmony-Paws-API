import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SendFriendRequestDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'UUID de l\'utilisateur à qui envoyer la demande',
    format: 'uuid',
  })
  @IsUUID()
  recipientId: string;
}
