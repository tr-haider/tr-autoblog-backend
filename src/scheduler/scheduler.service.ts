import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BlogGeneratorService } from '../blog-generator/blog-generator.service';
import { EmailService } from '../email-service/email.service';
import { TopicResearchService } from '../topic-research/topic-research.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private blogGeneratorService: BlogGeneratorService,
    private emailService: EmailService,
    private topicResearchService: TopicResearchService,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyBlogGeneration() {
    this.logger.log('Starting weekly blog generation...');
    
    try {
      // Generate 3 trending blogs
      const blogs = await this.blogGeneratorService.generateTrendingBlogs(3);
      
      if (blogs.length > 0) {
        // Ensure DOCX files are generated for all blogs
        for (const blog of blogs) {
          if (!blog.docxBuffer) {
            const docxBuffer = await this.blogGeneratorService['createDocxDocument'](blog);
            blog.docxBuffer = docxBuffer;
          }
        }
        
        // Send weekly digest email
        const emailSent = await this.emailService.sendWeeklyBlogDigest(blogs);
        
        if (emailSent) {
          this.logger.log(`Weekly blog generation completed successfully. Generated ${blogs.length} blogs with DOCX attachments.`);
        } else {
          this.logger.error('Failed to send weekly digest email');
        }
      } else {
        this.logger.warn('No blogs were generated for weekly digest');
      }
      
    } catch (error) {
      this.logger.error('Error in weekly blog generation:', error.message);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailyBlogGeneration() {
    this.logger.log('Starting daily blog generation...');
    
    try {
      // Generate one trending blog with DOCX
      const result = await this.blogGeneratorService.generateBlogFromTrendingTopic();
      
      if (result.success && result.blogPost) {
        // Ensure DOCX is generated
        if (!result.blogPost.docxBuffer) {
          const docxBuffer = await this.blogGeneratorService['createDocxDocument'](result.blogPost);
          result.blogPost.docxBuffer = docxBuffer;
        }
        
        // Send individual blog email
        const emailSent = await this.emailService.sendBlogToMarketingTeam(result.blogPost);
        
        if (emailSent) {
          this.logger.log('Daily blog generation and email completed successfully with DOCX');
        } else {
          this.logger.error('Failed to send daily blog email');
        }
      } else {
        this.logger.warn('Daily blog generation failed:', result.error);
      }
      
    } catch (error) {
      this.logger.error('Error in daily blog generation:', error.message);
    }
  }

  // Manual trigger methods for testing
  async triggerWeeklyGeneration(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Manually triggering weekly blog generation...');
      await this.handleWeeklyBlogGeneration();
      return {
        success: true,
        message: 'Weekly blog generation completed successfully'
      };
    } catch (error) {
      this.logger.error('Manual weekly generation failed:', error.message);
      return {
        success: false,
        message: `Weekly generation failed: ${error.message}`
      };
    }
  }

  async triggerDailyGeneration(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Manually triggering daily blog generation...');
      await this.handleDailyBlogGeneration();
      return {
        success: true,
        message: 'Daily blog generation completed successfully'
      };
    } catch (error) {
      this.logger.error('Manual daily generation failed:', error.message);
      return {
        success: false,
        message: `Daily generation failed: ${error.message}`
      };
    }
  }
} 