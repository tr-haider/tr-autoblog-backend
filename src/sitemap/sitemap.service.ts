import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

export interface SiteLink {
  title: string;
  url: string;
  category: string;
  type: 'resource' | 'blog' | 'portfolio';
  description?: string;
}

export interface SitemapLinksResult {
  resources: SiteLink[];
  blogs: SiteLink[];
  portfolio: SiteLink[];
}

const SITEMAP_INDEX_URL = 'https://technologyrivers.com/sitemap_index.xml';
const SITE_ORIGIN = 'https://technologyrivers.com';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const INDEX_PATH_EXACT = new Set([
  '/',
  '/blog',
  '/blog/',
  '/portfolio',
  '/portfolio/',
  '/resources',
  '/resources/',
  '/services',
  '/services/',
  '/about-us',
  '/about-us/',
  '/contact-us',
  '/contact-us/',
  '/careers',
  '/careers/',
  '/our-work',
  '/our-work/',
  '/our-process',
  '/our-process/',
  '/events',
  '/events/',
  '/reviews',
  '/reviews/',
  '/referral',
  '/referral/',
]);

const RESOURCE_PATH_PATTERNS = [
  /checklist/i,
  /ebook/i,
  /playbook/i,
  /guide/i,
  /whitepaper/i,
  /resources/i,
  /download/i,
];

@Injectable()
export class SitemapService {
  private readonly logger = new Logger(SitemapService.name);
  private readonly parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
  private cache: { data: SitemapLinksResult; fetchedAt: number } | null = null;

  async getAllLinks(forceRefresh = false): Promise<SitemapLinksResult> {
    if (
      !forceRefresh &&
      this.cache &&
      Date.now() - this.cache.fetchedAt < CACHE_TTL_MS
    ) {
      return this.cache.data;
    }

    const data = await this.fetchAndClassifyLinks();
    this.cache = { data, fetchedAt: Date.now() };
    return data;
  }

  private async fetchAndClassifyLinks(): Promise<SitemapLinksResult> {
    this.logger.log('Fetching links from technologyrivers.com sitemap');

    const childSitemapUrls = await this.fetchChildSitemapUrls();
    const blogs: SiteLink[] = [];
    const portfolio: SiteLink[] = [];
    const resources: SiteLink[] = [];

    for (const sitemapUrl of childSitemapUrls) {
      const urls = await this.fetchUrlsFromSitemap(sitemapUrl);
      const name = sitemapUrl.toLowerCase();

      if (name.includes('blogs-sitemap')) {
        blogs.push(...this.mapUrls(urls, 'blog'));
      } else if (name.includes('portfolio-sitemap')) {
        portfolio.push(...this.mapUrls(urls, 'portfolio'));
      } else if (name.includes('page-sitemap')) {
        resources.push(...this.mapPageUrls(urls));
      }
    }

    const result: SitemapLinksResult = {
      blogs: this.deduplicateLinks(blogs),
      portfolio: this.deduplicateLinks(portfolio),
      resources: this.deduplicateLinks(resources),
    };

    this.logger.log(
      `Sitemap loaded: ${result.blogs.length} blogs, ${result.portfolio.length} portfolio, ${result.resources.length} resources`,
    );

    return result;
  }

  private async fetchChildSitemapUrls(): Promise<string[]> {
    const response = await axios.get(SITEMAP_INDEX_URL, { timeout: 15000 });
    const parsed = this.parser.parse(response.data);
    const entries = this.asArray(parsed?.sitemapindex?.sitemap);

    return entries
      .map((entry) => this.extractLoc(entry))
      .filter((url): url is string => Boolean(url))
      .filter((url) => {
        const lower = url.toLowerCase();
        return (
          lower.includes('blogs-sitemap') ||
          lower.includes('portfolio-sitemap') ||
          lower.includes('page-sitemap')
        );
      });
  }

  private async fetchUrlsFromSitemap(sitemapUrl: string): Promise<string[]> {
    try {
      const response = await axios.get(sitemapUrl, { timeout: 15000 });
      const parsed = this.parser.parse(response.data);
      const entries = this.asArray(parsed?.urlset?.url);

      return entries
        .map((entry) => this.extractLoc(entry))
        .filter((url): url is string => Boolean(url));
    } catch (error) {
      this.logger.warn(`Failed to fetch sitemap ${sitemapUrl}: ${error.message}`);
      return [];
    }
  }

  private mapUrls(urls: string[], type: 'blog' | 'portfolio'): SiteLink[] {
    return urls
      .filter((url) => this.isContentUrl(url, type))
      .map((url) => this.toSiteLink(url, type));
  }

  private mapPageUrls(urls: string[]): SiteLink[] {
    return urls
      .filter((url) => this.isResourcePage(url))
      .map((url) => this.toSiteLink(url, 'resource'));
  }

  private isContentUrl(url: string, type: 'blog' | 'portfolio'): boolean {
    const path = this.normalizePath(url);
    if (INDEX_PATH_EXACT.has(path)) return false;

    if (type === 'blog') {
      return path.startsWith('/blog/') && path.length > '/blog/'.length;
    }

    return path.startsWith('/portfolio/') && path.length > '/portfolio/'.length;
  }

  private isResourcePage(url: string): boolean {
    const path = this.normalizePath(url);
    if (INDEX_PATH_EXACT.has(path)) return false;
    if (path.startsWith('/blog/') || path.startsWith('/portfolio/')) return false;

    if (path.startsWith('/services/') && path.length > '/services/'.length) {
      return true;
    }

    return RESOURCE_PATH_PATTERNS.some((pattern) => pattern.test(path));
  }

  private toSiteLink(url: string, type: SiteLink['type']): SiteLink {
    const title = this.titleFromUrl(url);
    const category = this.inferCategoryFromTitle(title);

    return {
      title,
      url: this.normalizeUrl(url),
      category,
      type,
      description: `Technology Rivers ${type}: ${title}`,
    };
  }

  private titleFromUrl(url: string): string {
    const path = this.normalizePath(url);
    const slug = path.split('/').filter(Boolean).pop() || 'page';
    return slug
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private inferCategoryFromTitle(title: string): string {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('hipaa') || titleLower.includes('compliance')) {
      return 'HIPAA Compliance';
    }
    if (titleLower.includes('ai') || titleLower.includes('machine learning')) {
      return 'AI & Machine Learning';
    }
    if (titleLower.includes('healthcare') || titleLower.includes('medical') || titleLower.includes('clinical')) {
      return 'Healthcare Tech';
    }
    if (titleLower.includes('app') || titleLower.includes('mobile')) {
      return 'App Development';
    }
    if (titleLower.includes('cloud') || titleLower.includes('hosting')) {
      return 'Cloud & Infrastructure';
    }
    if (titleLower.includes('security')) {
      return 'Security';
    }
    if (titleLower.includes('development') || titleLower.includes('software')) {
      return 'Software Development';
    }
    return 'Technology';
  }

  private deduplicateLinks(links: SiteLink[]): SiteLink[] {
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();

    return links.filter((link) => {
      const urlKey = this.normalizeUrl(link.url).toLowerCase();
      const titleKey = link.title.toLowerCase();
      if (seenUrls.has(urlKey) || seenTitles.has(titleKey)) return false;
      seenUrls.add(urlKey);
      seenTitles.add(titleKey);
      return true;
    });
  }

  private normalizePath(url: string): string {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `${SITE_ORIGIN}${url}`);
      const path = parsed.pathname.replace(/\/$/, '') || '/';
      return path.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  private normalizeUrl(url: string): string {
    const parsed = new URL(url.startsWith('http') ? url : `${SITE_ORIGIN}${url}`);
    return parsed.href.replace(/\/$/, '');
  }

  private extractLoc(entry: unknown): string | null {
    if (!entry || typeof entry !== 'object') return null;
    const loc = (entry as { loc?: string }).loc;
    return typeof loc === 'string' && loc.trim() ? loc.trim() : null;
  }

  private asArray<T>(value: T | T[] | undefined): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }
}
