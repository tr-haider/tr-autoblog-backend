import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ResourceLink {
  title: string;
  url: string;
  category: string;
  type: 'resource' | 'blog';
  description?: string;
}

@Injectable()
export class WebScraperService {
  private readonly logger = new Logger(WebScraperService.name);
  
  async scrapeResourceLinks(): Promise<ResourceLink[]> {
    try {
      const response = await axios.get('https://technologyrivers.com/resources/');
      const $ = cheerio.load(response.data);
      const resources: ResourceLink[] = [];

      this.logger.log('Scraping resource links from Technology Rivers resources page');

      // Look for resource sections with download buttons
      $('.download-section, .resource-item, .ebook-item').each((index, element) => {
        const $element = $(element);
        const title = $element.find('h3, h4, .title').text().trim();
        const description = $element.find('p, .description').text().trim();
        const downloadLink = $element.find('a[href*="download"], .download-btn, a[href$=".pdf"]').attr('href');
        
        if (title && downloadLink) {
          const fullUrl = downloadLink.startsWith('http') ? downloadLink : `https://technologyrivers.com${downloadLink}`;
          const category = this.inferCategoryFromTitle(title);
          
          resources.push({
            title,
            url: fullUrl,
            category,
            type: 'resource',
            description: description.substring(0, 150) || `Download guide about ${title.toLowerCase()}`
          });
        }
      });

      // Alternative approach: Look for download buttons and work backwards to find titles
      $('a[href*="download"], .download-btn, a[href$=".pdf"], a:contains("Download")').each((index, element) => {
        const $downloadBtn = $(element);
        const downloadUrl = $downloadBtn.attr('href');
        
        if (downloadUrl) {
          // Find the associated title/content
          const $container = $downloadBtn.closest('.resource-container, .ebook-container, .download-item');
          let title = $container.find('h3, h4, .title').text().trim();
          
          if (!title) {
            // Look for title in parent or sibling elements
            title = $downloadBtn.parent().find('h3, h4, .title').text().trim();
            if (!title) {
              title = $downloadBtn.siblings('h3, h4, .title').text().trim();
            }
          }
          
          if (title && !resources.some(r => r.title === title)) {
            const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `https://technologyrivers.com${downloadUrl}`;
            const category = this.inferCategoryFromTitle(title);
            const description = $container.find('p, .description').text().trim();
            
            resources.push({
              title,
              url: fullUrl,
              category,
              type: 'resource',
              description: description.substring(0, 150) || `Download guide about ${title.toLowerCase()}`
            });
          }
        }
      });

      // If we didn't find specific download links, create unique URLs for each resource
      if (resources.length === 0) {
        this.logger.warn('No download links found, using fallback approach with unique identifiers');
        
        const fallbackResources = [
          {
            title: 'HIPAA Compliant Web App Development Checklist',
            url: 'https://technologyrivers.com/resources/#hipaa-web-checklist',
            category: 'HIPAA Compliance',
            description: 'Complete guide for developing secure HIPAA-compliant web applications'
          },
          {
            title: 'HIPAA Compliant Mobile App Development Checklist', 
            url: 'https://technologyrivers.com/resources/#hipaa-mobile-checklist',
            category: 'HIPAA Compliance',
            description: 'Essential checklist for HIPAA-compliant mobile app development'
          },
          {
            title: 'The Ultimate Software Development Checklist',
            url: 'https://technologyrivers.com/the-ultimate-checklist-for-software-development/',
            category: 'Software Development',
            description: 'Comprehensive checklist for successful software development projects'
          },
          {
            title: 'How Long Does it Take to Develop an App?',
            url: 'https://technologyrivers.com/resources/#app-development-timeline',
            category: 'App Development',
            description: 'Timeline guide for mobile and web application development'
          },
          {
            title: 'Top Ways App Development Goes Wrong & How to Get Back on Track',
            url: 'https://technologyrivers.com/resources/#app-development-fixes',
            category: 'App Development', 
            description: '8 proven strategies to avoid common development pitfalls'
          },
          {
            title: 'Top 8 AI Tools You Need to Know About',
            url: 'https://technologyrivers.com/top-8-ai-tools-you-need-to-know/',
            category: 'AI & Machine Learning',
            description: 'Essential AI tools for modern software development'
          },
          {
            title: '13 Proven Strategies to Boost Your App',
            url: 'https://technologyrivers.com/resources/#app-promotion-strategies',
            category: 'App Development',
            description: 'App promotion playbook with proven marketing strategies'
          }
        ];

        resources.push(...fallbackResources.map(item => ({
          ...item,
          type: 'resource' as const
        })));
      }

      this.logger.log(`Successfully scraped ${resources.length} resource links`);
      return resources;
    } catch (error) {
      this.logger.error('Failed to scrape resource links:', error.message);
      return this.getFallbackResourceLinks();
    }
  }

  async scrapeBlogLinks(): Promise<ResourceLink[]> {
    // For initial load, only scrape the first page
    return this.scrapeBlogLinksFromPage(1);
  }

  async scrapeBlogLinksFromPage(page: number): Promise<ResourceLink[]> {
    try {
      const url = page === 1 
        ? 'https://technologyrivers.com/blog/' 
        : `https://technologyrivers.com/blog/page/${page}/`;
      
      this.logger.log(`Scraping blog page ${page}: ${url}`);
      
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);
      
      // Extract blog post links from the page
      const pageBlogs = this.extractBlogLinksFromPage($, page);
      
      this.logger.log(`Successfully scraped ${pageBlogs.length} blog links from page ${page}`);
      return pageBlogs.length > 0 ? pageBlogs : (page === 1 ? this.getFallbackBlogLinks() : []);
    } catch (error) {
      this.logger.error(`Failed to scrape blog page ${page}:`, error.message);
      return page === 1 ? this.getFallbackBlogLinks() : [];
    }
  }

  async scrapeMultipleBlogPages(startPage: number, endPage: number): Promise<ResourceLink[]> {
    try {
      const allBlogs: ResourceLink[] = [];
      const globalSeenUrls = new Set<string>();
      const globalSeenTitles = new Set<string>();
      
      for (let page = startPage; page <= endPage; page++) {
        try {
          const pageBlogs = await this.scrapeBlogLinksFromPage(page);
          
          // Additional global deduplication across pages
          pageBlogs.forEach(blog => {
            const normalizedTitle = blog.title.toLowerCase().trim();
            if (!globalSeenUrls.has(blog.url) && !globalSeenTitles.has(normalizedTitle)) {
              globalSeenUrls.add(blog.url);
              globalSeenTitles.add(normalizedTitle);
              allBlogs.push(blog);
            }
          });
          
          // Add delay between requests to be respectful
          if (page < endPage) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (pageError) {
          this.logger.warn(`Failed to scrape blog page ${page}:`, pageError.message);
          // Continue with other pages even if one fails
          continue;
        }
      }

      this.logger.log(`Successfully scraped ${allBlogs.length} unique blog links from pages ${startPage}-${endPage}`);
      return allBlogs;
    } catch (error) {
      this.logger.error(`Failed to scrape blog pages ${startPage}-${endPage}:`, error.message);
      return [];
    }
  }

  // Helper method to deduplicate blogs globally
  private deduplicateBlogs(blogs: ResourceLink[]): ResourceLink[] {
    const seen = new Set<string>();
    const seenTitles = new Set<string>();
    
    return blogs.filter(blog => {
      const normalizedTitle = blog.title.toLowerCase().trim();
      if (seen.has(blog.url) || seenTitles.has(normalizedTitle)) {
        return false;
      }
      seen.add(blog.url);
      seenTitles.add(normalizedTitle);
      return true;
    });
  }

  private extractBlogLinksFromPage($: cheerio.CheerioAPI, pageNumber: number): ResourceLink[] {
    const blogs: ResourceLink[] = [];
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    
    try {
      // Helper function to add unique blog
      const addUniqueBlog = (title: string, url: string, $element: cheerio.Cheerio<any>) => {
        if (!title || !url || !url.includes('/blog/')) return;
        
        const fullUrl = url.startsWith('http') ? url : `https://technologyrivers.com${url}`;
        const normalizedTitle = title.toLowerCase().trim();
        
        // Check for duplicates by URL and title
        if (seenUrls.has(fullUrl) || seenTitles.has(normalizedTitle)) {
          return;
        }
        
        seenUrls.add(fullUrl);
        seenTitles.add(normalizedTitle);
        
        const category = this.inferCategoryFromTitle(title);
        const description = this.extractDescriptionForBlogPost($element, title);
        
        blogs.push({
          title,
          url: fullUrl,
          category,
          type: 'blog',
          description
        });
      };

      // Look for blog post titles and links in various containers
      const selectors = [
        'h3 a',
        '.entry-title a',
        '.post-title a',
        '.blog-title a',
        '.article-title a',
        'h2 a',
        'h4 a'
      ];

      selectors.forEach(selector => {
        $(selector).each((index, element) => {
          const $element = $(element);
          const title = $element.text().trim();
          const url = $element.attr('href');
          
          if (url) {
            addUniqueBlog(title, url, $element);
          }
        });
      });

      // Also look for direct blog links in article containers
      $('article, .post, .blog-post, .entry').each((index, element) => {
        const $article = $(element);
        const $link = $article.find('a[href*="/blog/"]').first();
        
        if ($link.length > 0) {
          const url = $link.attr('href');
          let title = $link.text().trim();
          
          // If the link text is not descriptive, look for title in nearby elements
          if (!title || title.length < 10) {
            title = $article.find('h1, h2, h3, h4, .title, .post-title').first().text().trim();
          }
          
          if (url) {
            addUniqueBlog(title, url, $article);
          }
        }
      });

      this.logger.log(`Extracted ${blogs.length} unique blog links from page ${pageNumber}`);

    } catch (error) {
      this.logger.warn(`Error extracting links from page ${pageNumber}:`, error.message);
    }

    return blogs;
  }

  private inferCategoryFromTitle(title: string): string {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('hipaa') || titleLower.includes('compliance')) {
      return 'HIPAA Compliance';
    } else if (titleLower.includes('ai') || titleLower.includes('artificial intelligence') || titleLower.includes('machine learning')) {
      return 'AI & Machine Learning';
    } else if (titleLower.includes('healthcare') || titleLower.includes('medical') || titleLower.includes('clinical')) {
      return 'Healthcare Tech';
    } else if (titleLower.includes('app') || titleLower.includes('mobile') || titleLower.includes('wearable')) {
      return 'App Development';
    } else if (titleLower.includes('cloud') || titleLower.includes('aws') || titleLower.includes('hosting')) {
      return 'Cloud & Infrastructure';
    } else if (titleLower.includes('security') || titleLower.includes('phi') || titleLower.includes('data protection')) {
      return 'Security';
    } else if (titleLower.includes('development') || titleLower.includes('software') || titleLower.includes('coding')) {
      return 'Software Development';
    } else {
      return 'Technology';
    }
  }

  private extractDescriptionForBlogPost($element: cheerio.Cheerio<any>, title: string): string {
    // Try to find description in nearby elements
    const $parent = $element.parent();
    const $next = $element.next();
    
    // Look for description in various possible locations
    let description = $parent.find('p').first().text().trim();
    if (!description) {
      description = $next.text().trim();
    }
    if (!description) {
      description = $parent.siblings('p').first().text().trim();
    }
    
    // Clean up and truncate description
    if (description) {
      description = description.replace(/\s+/g, ' ').substring(0, 150);
      if (description.length === 150) description += '...';
    } else {
      // Generate a fallback description based on the title
      description = `Learn about ${title.toLowerCase()} and its applications in modern software development.`;
    }
    
    return description;
  }

  async getAllLinks(): Promise<{ resources: ResourceLink[], blogs: ResourceLink[] }> {
    const [resources, blogs] = await Promise.all([
      this.scrapeResourceLinks(),
      this.scrapeBlogLinks()
    ]);

    return { resources, blogs };
  }

  private getFallbackResourceLinks(): ResourceLink[] {
    return [
      {
        title: 'HIPAA Compliant Web App Development Checklist',
        url: 'https://technologyrivers.com/resources/#hipaa-web-checklist',
        category: 'HIPAA Compliance',
        type: 'resource',
        description: 'Complete guide for developing secure HIPAA-compliant web applications'
      },
      {
        title: 'HIPAA Compliant Mobile App Development Checklist', 
        url: 'https://technologyrivers.com/resources/#hipaa-mobile-checklist',
        category: 'HIPAA Compliance',
        type: 'resource',
        description: 'Essential checklist for HIPAA-compliant mobile app development'
      },
      {
        title: 'The Ultimate Software Development Checklist',
        url: 'https://technologyrivers.com/the-ultimate-checklist-for-software-development/',
        category: 'Software Development',
        type: 'resource',
        description: 'Comprehensive checklist for successful software development projects'
      },
      {
        title: 'How Long Does it Take to Develop an App?',
        url: 'https://technologyrivers.com/resources/#app-development-timeline',
        category: 'App Development',
        type: 'resource',
        description: 'Timeline guide for mobile and web application development'
      },
      {
        title: 'Top Ways App Development Goes Wrong & How to Get Back on Track',
        url: 'https://technologyrivers.com/resources/#app-development-fixes',
        category: 'App Development', 
        type: 'resource',
        description: '8 proven strategies to avoid common development pitfalls'
      },
      {
        title: 'Top 8 AI Tools You Need to Know About',
        url: 'https://technologyrivers.com/top-8-ai-tools-you-need-to-know/',
        category: 'AI & Machine Learning',
        type: 'resource',
        description: 'Essential AI tools for modern software development'
      },
      {
        title: '13 Proven Strategies to Boost Your App',
        url: 'https://technologyrivers.com/resources/#app-promotion-strategies',
        category: 'App Development',
        type: 'resource',
        description: 'App promotion playbook with proven marketing strategies'
      }
    ];
  }

  private getFallbackBlogLinks(): ResourceLink[] {
    return [
      {
        title: 'AI for Workflow Automation & Compliance Monitoring',
        url: 'https://technologyrivers.com/blog/ai-workflow-automation-compliance-monitoring/',
        category: 'AI & Compliance',
        type: 'blog',
        description: 'How AI transforms business workflows and compliance monitoring'
      },
      {
        title: 'Building a HIPAA-Compliant AI App with Vibe Coding',
        url: 'https://technologyrivers.com/blog/building-hipaa-compliant-ai-app-vibe-coding/',
        category: 'HIPAA & AI',
        type: 'blog',
        description: 'Complete guide to developing HIPAA-compliant AI applications'
      },
      {
        title: 'How to Build HIPAA‑Compliant AI‑Powered Healthcare Apps',
        url: 'https://technologyrivers.com/blog/hipaa-compliant-ai-powered-healthcare-apps/',
        category: 'Healthcare AI',
        type: 'blog',
        description: 'Best practices for AI integration in healthcare applications'
      },
      {
        title: 'Top Trends in Healthcare Wearable App Development',
        url: 'https://technologyrivers.com/blog/healthcare-wearable-app-development-trends/',
        category: 'Healthcare Tech',
        type: 'blog',
        description: 'Latest trends in wearable technology for healthcare'
      },
      {
        title: 'The Hidden Costs of Ignoring HIPAA in Your Cloud-Based App',
        url: 'https://technologyrivers.com/blog/hidden-costs-ignoring-hipaa-cloud-app/',
        category: 'HIPAA Compliance',
        type: 'blog',
        description: 'Financial and legal risks of HIPAA non-compliance'
      },
      {
        title: 'Understanding Enterprise Application Integration Strategies',
        url: 'https://technologyrivers.com/blog/enterprise-application-integration-strategies/',
        category: 'Enterprise Development',
        type: 'blog',
        description: 'Strategies for integrating enterprise healthcare systems'
      },
      {
        title: 'Benefits of Cross-Platform App Development',
        url: 'https://technologyrivers.com/blog/benefits-cross-platform-app-development/',
        category: 'App Development',
        type: 'blog',
        description: 'Advantages of cross-platform development for healthcare apps'
      },
      {
        title: 'How to Secure PHI in AWS: A DevOps-Led Blueprint for HIPAA Compliance',
        url: 'https://technologyrivers.com/blog/secure-phi-aws-devops-hipaa-compliance/',
        category: 'Cloud Security',
        type: 'blog',
        description: 'DevOps blueprint for HIPAA-compliant AWS infrastructure'
      },
      {
        title: 'Streamlining Clinical Documentation with AWS HealthScribe: A HIPAA-Eligible AI Solution',
        url: 'https://technologyrivers.com/blog/streamlining-clinical-documentation-with-aws-healthscribe-a-hipaa-eligible-ai-solution/',
        category: 'Healthcare AI',
        type: 'blog',
        description: 'AI-powered clinical documentation using AWS HealthScribe'
      },
      {
        title: 'Top 5 Reasons Software Projects Fail And How to Fix Them',
        url: 'https://technologyrivers.com/blog/software-projects-fail-how-to-fix/',
        category: 'Software Development',
        type: 'blog',
        description: 'Common causes of software project failures and solutions'
      },
      {
        title: 'Applied Neuroscientist Dr. Bethany Raines on Digitizing Pain Therapy',
        url: 'https://technologyrivers.com/blog/dr-bethany-raines-digitizing-pain-therapy/',
        category: 'Healthcare Tech',
        type: 'blog',
        description: 'Innovative approaches to digital pain therapy solutions'
      },
      {
        title: 'Building the Tee Time App: Partnership Success Story',
        url: 'https://technologyrivers.com/blog/tee-time-app-partnership-success/',
        category: 'Case Studies',
        type: 'blog',
        description: 'Success story of developing a golf scheduling application'
      }
    ];
  }
}
