import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DogFriendlyPlaceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  osm_type!: string;

  @ApiProperty()
  osm_id!: string;

  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;

  @ApiProperty()
  geohash!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  name?: string | null;

  @ApiPropertyOptional()
  dog_policy?: string | null;

  @ApiPropertyOptional()
  city?: string | null;

  @ApiPropertyOptional()
  postcode?: string | null;

  @ApiPropertyOptional()
  street?: string | null;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional()
  website?: string | null;

  @ApiPropertyOptional()
  opening_hours?: string | null;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  created_by_id?: string | null;

  @ApiProperty()
  created_at!: string;

  @ApiProperty()
  updated_at!: string;
}

export class DogFriendlyPlacesPaginatedResponseDto {
  @ApiProperty({ type: [DogFriendlyPlaceResponseDto] })
  places!: DogFriendlyPlaceResponseDto[];

  @ApiProperty()
  total_count!: number;

  @ApiProperty()
  has_more!: boolean;
}
