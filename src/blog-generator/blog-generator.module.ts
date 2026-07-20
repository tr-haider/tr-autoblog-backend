import { Module } from '@nestjs/common';
import { BlogGeneratorController } from './blog-generator.controller';
import { BlogGeneratorService } from './blog-generator.service';
import { EmailModule } from '../email-service/email.module';
import { TopicResearchModule } from '../topic-research/topic-research.module';
import { SitemapModule } from '../sitemap/sitemap.module';

@Module({
  imports: [EmailModule, TopicResearchModule, SitemapModule],
  controllers: [BlogGeneratorController],
  providers: [BlogGeneratorService],
  exports: [BlogGeneratorService],
})
export class BlogGeneratorModule {} 