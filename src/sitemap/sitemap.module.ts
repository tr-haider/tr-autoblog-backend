import { Module } from '@nestjs/common';
import { SitemapService } from './sitemap.service';

@Module({
  providers: [SitemapService],
  exports: [SitemapService],
})
export class SitemapModule {}
