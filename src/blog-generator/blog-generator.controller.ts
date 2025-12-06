import { Controller, Post, Body, Get, Query, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { BlogGeneratorService } from './blog-generator.service';
import { BlogGenerationDto, BlogPostDto } from '../dto/blog.dto';
import { BlogGenerationResponse, BlogPost } from '../interfaces/blog.interface';

@Controller('blog-generator')
export class BlogGeneratorController {
  constructor(private readonly blogGeneratorService: BlogGeneratorService) {}

  @Post('generate')
  async generateBlogPost(@Body() request: BlogGenerationDto): Promise<BlogGenerationResponse> {
    return this.blogGeneratorService.generateBlogPost(request);
  }

  @Post('generate-docx')
  async generateBlogPostAsDocx(
    @Body() request: BlogGenerationDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.blogGeneratorService.generateBlogPostAsDocx(request);
    
    if (result.success && result.blogPost && result.blogPost.docxBuffer) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${result.blogPost.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx"`);
      res.send(result.blogPost.docxBuffer);
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to generate DOCX document',
      });
    }
  }

  @Post('download-docx')
  async downloadBlogAsDocx(
    @Body() blogPost: any,
    @Res() res: Response,
  ): Promise<void> {
    try {
      console.log('Received blog post for DOCX download:', JSON.stringify(blogPost, null, 2));
      const docxBuffer = await this.blogGeneratorService.createDocxFromBlog(blogPost);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${blogPost.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx"`);
      res.send(docxBuffer);
    } catch (error) {
      console.error('DOCX download error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to generate DOCX document: ' + error.message,
      });
    }
  }

  @Post('download-html')
  async downloadBlogAsHtml(
    @Body() blogPost: any,
    @Res() res: Response,
  ): Promise<void> {
    try {
      console.log('Received blog post for HTML download:', JSON.stringify(blogPost, null, 2));
      const htmlBuffer = await this.blogGeneratorService.createHtmlFromBlog(blogPost);
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${blogPost.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html"`);
      res.send(htmlBuffer);
    } catch (error) {
      console.error('HTML download error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to generate HTML document: ' + error.message,
      });
    }
  }

  @Post('generate-and-save')
  async generateAndSaveBlog(@Body() request: BlogGenerationDto): Promise<BlogGenerationResponse> {
    return this.blogGeneratorService.generateAndSaveBlog(request);
  }

  @Post('generate-and-email')
  async generateAndEmailBlog(@Body() request: BlogGenerationDto): Promise<BlogGenerationResponse> {
    return this.blogGeneratorService.generateAndEmailBlog(request);
  }

  @Post('generate-trending')
  async generateBlogFromTrendingTopic(): Promise<BlogGenerationResponse> {
    return this.blogGeneratorService.generateBlogFromTrendingTopic();
  }

  @Post('generate-trending-weekly')
  async generateTrendingBlogs(@Query('count') count: number = 3): Promise<BlogPost[]> {
    return this.blogGeneratorService.generateTrendingBlogs(count);
  }

  @Get('topics')
  async getAvailableTopics(): Promise<string[]> {
    // This would typically come from configuration
    return [
      'HIPAA Compliance Best Practices',
      'Healthcare AI Trends',
      'Regulatory Updates',
      'Data Security in Healthcare',
      'AI in Medical Imaging',
      'Telemedicine Regulations',
      'Healthcare Data Privacy',
      'AI Ethics in Healthcare',
      'Digital Health Innovation',
      'Healthcare Cybersecurity',
    ];
  }

  @Get('suggested-topics')
  async getSuggestedTopics(): Promise<any[]> {
    return this.blogGeneratorService.generateSuggestedTopics();
  }

  @Get('separated-links')
  async getSeparatedLinks(): Promise<{ resources: any[], blogs: any[] }> {
    return this.blogGeneratorService.getSeparatedLinks();
  }

  @Get('load-more-blogs/:page')
  async loadMoreBlogLinks(@Param('page') page: string): Promise<{ blogs: any[] }> {
    const pageNumber = parseInt(page, 10);
    if (isNaN(pageNumber) || pageNumber < 1) {
      throw new Error('Invalid page number');
    }
    
    const blogs = await this.blogGeneratorService.loadMoreBlogLinks(pageNumber);
    return { blogs };
  }

  @Get('health')
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
} 