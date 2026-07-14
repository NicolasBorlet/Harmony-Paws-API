import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';

export class VaccinationResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  dog_id: string;

  @ApiProperty({ example: 'Rage' })
  name: string;

  @ApiProperty({ example: '2026-03-15T00:00:00.000Z' })
  date: string;

  @ApiProperty({ example: '2026-03-15T10:00:00.000Z' })
  created_at: string;
}

export class DogMeasurementResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  dog_id: string;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  date: string;

  @ApiPropertyOptional({ example: 58.5, description: 'Taille en cm' })
  height?: number | null;

  @ApiPropertyOptional({ example: 28.3, description: 'Poids en kg' })
  weight?: number | null;

  @ApiProperty({ example: '2026-06-01T12:00:00.000Z' })
  created_at: string;
}

export class HealthDocumentResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  dog_id: string;

  @ApiPropertyOptional({ example: 'ordonnance-mars.pdf' })
  file_name?: string | null;

  @ApiPropertyOptional({ example: '42.pdf' })
  storage_key?: string | null;

  @ApiPropertyOptional({ example: 'application/pdf' })
  mime_type?: string | null;

  @ApiProperty({ enum: DocumentType, example: DocumentType.prescription })
  document_type: DocumentType;

  @ApiPropertyOptional({ example: 'Clinique vétérinaire du Parc' })
  place?: string | null;

  @ApiPropertyOptional({ example: 'Antibiotiques post-opératoires' })
  reason?: string | null;

  @ApiProperty({ example: '2026-06-01T12:00:00.000Z' })
  created_at: string;
}

export class HealthReminderResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  dog_id: string;

  @ApiProperty({ example: 'Rappel vermifuge' })
  title: string;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  date: string;

  @ApiPropertyOptional({ example: 'Tous les 3 mois' })
  notes?: string | null;

  @ApiProperty({ example: '2026-06-01T12:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-06-19T10:00:00.000Z' })
  updated_at: string;
}
