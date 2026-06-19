import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  place?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  onBoarding?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expoPushToken?: string;
}
