import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthCheckResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok'] })
  status: string;
}

export class StorageUrlResponseDto {
  @ApiProperty({
    example: 'https://minio.example.com/dogs/abc.jpeg?X-Amz-Signature=...',
    description: 'URL présignée valide 1 h',
  })
  url: string;

  @ApiProperty({ example: 'dogs', enum: ['users', 'dogs', 'rides', 'formations', 'modules', 'documents', 'user-badges'] })
  bucket: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000.jpeg' })
  key: string;
}

export class ToggleFavoriteResponseDto {
  @ApiProperty({ example: true })
  favorited: boolean;
}

export class PurchaseStatusResponseDto {
  @ApiProperty({ example: false, description: 'Statut d\'achat (RevenueCat à venir)' })
  purchased: boolean;
}

export class HasDogResponseDto {
  @ApiProperty({ example: true })
  has_dog: boolean;
}
