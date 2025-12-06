import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class BlogGenerationDto {
  @IsString()
  topic: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(5000)
  @Transform(({ value }) => parseInt(value))
  targetWordCount?: number;

  @IsOptional()
  @IsEnum(['professional', 'casual', 'technical', 'executive'])
  tone?: 'professional' | 'casual' | 'technical' | 'executive';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRegulatoryInfo?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedLinks?: string[];
}

export class BlogPostDto {
  @IsString()
  title: string;

  @IsString()
  summary: string;

  @IsString()
  content: string;

  @IsString()
  topic: string;

  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @IsNumber()
  wordCount: number;

  @IsNumber()
  readingTime: number;

  @IsString()
  status: string;

  @IsString()
  createdAt: string;
} 