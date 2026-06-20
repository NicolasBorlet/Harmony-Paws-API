import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'Code HTTP de la réponse',
  })
  status_code: number;

  @ApiProperty({
    example: 'Validation failed',
    description: 'Message d\'erreur lisible (chaîne ou messages concaténés)',
  })
  message: string;

  @ApiProperty({
    example: '/users/me',
    description: 'Chemin de la requête ayant échoué',
  })
  path: string;

  @ApiProperty({
    example: '2026-06-19T10:30:00.000Z',
    description: 'Horodatage ISO 8601 de l\'erreur',
  })
  timestamp: string;
}
