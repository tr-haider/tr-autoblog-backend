import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ContentTrackerRowDto {
  title: string;
  owner: string;
  writer: string;
  status: string;
  primaryKeyword: string;
  secondaryKeywords: string;
  metaTitle: string;
  metaDescription: string;
  servicePage: string;
  relatedBlog: string;
  portfolioCaseStudy: string;
  ebookLink: string;
  otherInternalLinks: string;
  cta: string;
  angle: string;
}

export class ContentTrackerRowsQueryDto {
  @IsOptional()
  @IsString()
  sheet?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
