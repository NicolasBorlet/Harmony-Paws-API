import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const HEALTH_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type HealthDocumentMimeType = (typeof HEALTH_DOCUMENT_MIME_TYPES)[number];

export class CreateVaccinationDto {
  @ApiProperty({
    example: 'Rage',
    description: 'Nom du vaccin ou rappel',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: '2026-03-15',
    description: 'Date d\'administration (ISO 8601)',
  })
  @IsDateString()
  date: string;
}

export class CreateMeasurementDto {
  @ApiProperty({
    example: '2026-06-01',
    description: 'Date de la mesure',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    example: 58.5,
    description: 'Taille du chien en centimètres',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  height?: number;

  @ApiPropertyOptional({
    example: 28.3,
    description: 'Poids du chien en kilogrammes',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  weight?: number;
}

export class CreateHealthDocumentDto {
  @ApiPropertyOptional({
    example: 'ordonnance-mars.pdf',
    description: 'Nom du fichier une fois uploadé sur le bucket documents',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.prescription,
    description: 'Type de document vétérinaire',
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiPropertyOptional({
    example: 'Clinique vétérinaire du Parc',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  place?: string;

  @ApiPropertyOptional({
    example: 'Antibiotiques post-opératoires',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'Type MIME du fichier à uploader',
    enum: HEALTH_DOCUMENT_MIME_TYPES,
  })
  @IsIn(HEALTH_DOCUMENT_MIME_TYPES)
  mimeType: HealthDocumentMimeType;
}

export class CreateHealthReminderDto {
  @ApiProperty({
    example: 'Rappel vermifuge',
    description: 'Titre du rappel affiché dans l\'app',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: '2026-07-01',
    description: 'Date du rappel',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    example: 'Tous les 3 mois',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateHealthReminderDto {
  @ApiPropertyOptional({ example: 'Rappel vermifuge — juillet' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'Reporter d\'un mois' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
