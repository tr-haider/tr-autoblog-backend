import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { BlogPost, EmailTemplate } from '../interfaces/blog.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = this.configService.get('email');
    
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
    });
  }

  async sendBlogToMarketingTeam(blogPost: BlogPost): Promise<boolean> {
    try {
      const marketingEmails = this.configService.get<string[]>('marketing.teamEmails');
      
      if (!marketingEmails || marketingEmails.length === 0) {
        this.logger.warn('No marketing team emails configured');
        return false;
      }

      // Ensure DOCX and HTML buffers are available
      if (!blogPost.docxBuffer || !blogPost.htmlBuffer) {
        this.logger.log('Generating DOCX and HTML buffers for email attachments...');
        const docxBuffer = await this.createDocxDocument(blogPost);
        const htmlBuffer = await this.createHtmlDocument(blogPost);
        blogPost.docxBuffer = docxBuffer;
        blogPost.htmlBuffer = htmlBuffer;
      }

      const emailTemplate = this.createBlogEmailTemplate(blogPost);
      
      const mailOptions = {
        from: this.configService.get('email.auth.user'),
        to: marketingEmails.join(', '),
        subject: emailTemplate.subject,
        html: emailTemplate.htmlContent,
        attachments: emailTemplate.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Blog email sent successfully to marketing team: ${result.messageId}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to send blog email:', error.message);
      return false;
    }
  }

  async sendWeeklyBlogDigest(blogPosts: BlogPost[]): Promise<boolean> {
    try {
      const marketingEmails = this.configService.get<string[]>('marketing.teamEmails');
      
      if (!marketingEmails || marketingEmails.length === 0) {
        this.logger.warn('No marketing team emails configured');
        return false;
      }

      // Ensure DOCX and HTML buffers are available for all blog posts
      for (const blogPost of blogPosts) {
        if (!blogPost.docxBuffer || !blogPost.htmlBuffer) {
          this.logger.log(`Generating DOCX and HTML buffers for: ${blogPost.title}`);
          const docxBuffer = await this.createDocxDocument(blogPost);
          const htmlBuffer = await this.createHtmlDocument(blogPost);
          blogPost.docxBuffer = docxBuffer;
          blogPost.htmlBuffer = htmlBuffer;
        }
      }

      const emailTemplate = this.createWeeklyDigestTemplate(blogPosts);
      
      const mailOptions = {
        from: this.configService.get('email.auth.user'),
        to: marketingEmails.join(', '),
        subject: emailTemplate.subject,
        html: emailTemplate.htmlContent,
        attachments: emailTemplate.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Weekly digest sent successfully: ${result.messageId}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to send weekly digest:', error.message);
      return false;
    }
  }

  private createBlogEmailTemplate(blogPost: BlogPost): EmailTemplate {
    const subject = `📝 New Blog Post: ${blogPost.title}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .stats { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .keywords { color: #007bff; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🤖 AutoBlog AI - New Blog Post Generated</h1>
          <p>A new blog post has been automatically generated and is ready for review.</p>
        </div>
        
        <div class="content">
          <h2>${blogPost.title}</h2>
          <p><strong>Summary:</strong> ${blogPost.summary}</p>
          
          <div class="stats">
            <p><strong>📊 Statistics:</strong></p>
            <ul>
              <li>Word Count: ${blogPost.wordCount}</li>
              <li>Reading Time: ${blogPost.readingTime} minutes</li>
              <li>Topic: ${blogPost.topic}</li>
              <li>Keywords: <span class="keywords">${blogPost.keywords.join(', ')}</span></li>
            </ul>
          </div>
          
          <h3>📄 Blog Content:</h3>
          <div>${blogPost.content}</div>
        </div>
        
        <div class="footer">
          <p><strong>Generated by AutoBlog AI</strong></p>
          <p>Generated on: ${blogPost.createdAt.toLocaleDateString()}</p>
          <p>Please review and publish this content as appropriate.</p>
          <p>Both DOCX and HTML versions are attached for easy editing and web publishing.</p>
        </div>
      </body>
      </html>
    `;

    const attachments: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }> = [];
    
    // Add DOCX attachment if available
    if (blogPost.docxBuffer) {
      attachments.push({
        filename: `${blogPost.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`,
        content: blogPost.docxBuffer,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
    }

    // Add HTML attachment if available
    if (blogPost.htmlBuffer) {
      attachments.push({
        filename: `${blogPost.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`,
        content: blogPost.htmlBuffer,
        contentType: 'text/html'
      });
    }

    return {
      subject,
      htmlContent,
      attachments
    };
  }

  private createWeeklyDigestTemplate(blogPosts: BlogPost[]): EmailTemplate {
    const subject = `📊 AutoBlog AI - Weekly Blog Digest (${blogPosts.length} Posts)`;
    
    let blogListHtml = '';
    const attachments: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }> = [];

    blogPosts.forEach((blogPost, index) => {
      blogListHtml += `
        <div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <h3>${index + 1}. ${blogPost.title}</h3>
          <p><strong>Summary:</strong> ${blogPost.summary}</p>
          <p><strong>Topic:</strong> ${blogPost.topic}</p>
          <p><strong>Keywords:</strong> <span class="keywords">${blogPost.keywords.join(', ')}</span></p>
          <p><strong>Stats:</strong> ${blogPost.wordCount} words, ${blogPost.readingTime} min read</p>
        </div>
      `;

      // Add individual DOCX and HTML attachments
      if (blogPost.docxBuffer) {
        attachments.push({
          filename: `${blogPost.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`,
          content: blogPost.docxBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
      }
      if (blogPost.htmlBuffer) {
        attachments.push({
          filename: `${blogPost.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`,
          content: blogPost.htmlBuffer,
          contentType: 'text/html'
        });
      }
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .keywords { color: #007bff; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🤖 AutoBlog AI - Weekly Blog Digest</h1>
          <p>This week's automatically generated blog posts are ready for review.</p>
        </div>
        
        <div class="content">
          <h2>📝 Generated Blog Posts (${blogPosts.length})</h2>
          ${blogListHtml}
        </div>
        
        <div class="footer">
          <p><strong>Generated by AutoBlog AI</strong></p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>Please review and publish these posts as appropriate.</p>
          <p>Each blog post is attached as both DOCX and HTML files for easy editing and web publishing.</p>
        </div>
      </body>
      </html>
    `;

    return {
      subject,
      htmlContent,
      attachments
    };
  }

  private async createDocxDocument(blogPost: BlogPost): Promise<Buffer> {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: blogPost.title,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: blogPost.summary,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: `Topic: ${blogPost.topic}`,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: `Keywords: ${blogPost.keywords.join(', ')}`,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: blogPost.content.replace(/<[^>]*>/g, ''), // Remove HTML tags
              spacing: { after: 400 },
            }),
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  private async createHtmlDocument(blogPost: BlogPost): Promise<Buffer> {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${blogPost.title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 15px;
            border-left: 4px solid #3498db;
            padding-left: 15px;
        }
        h3 {
            color: #2c3e50;
            margin-top: 25px;
            margin-bottom: 10px;
        }
        p {
            margin-bottom: 15px;
            text-align: justify;
        }
        ul {
            margin-bottom: 15px;
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        strong {
            color: #2c3e50;
        }
        a {
            color: #3498db;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .metadata {
            background-color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 14px;
        }
        .keywords {
            color: #3498db;
            font-weight: bold;
        }
        code {
            background-color: #f8f9fa;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #3498db;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${blogPost.title}</h1>
        
        <div class="metadata">
            <p><strong>Summary:</strong> ${blogPost.summary}</p>
            <p><strong>Topic:</strong> ${blogPost.topic}</p>
            <p><strong>Keywords:</strong> <span class="keywords">${blogPost.keywords.join(', ')}</span></p>
            <p><strong>Word Count:</strong> ${blogPost.wordCount} | <strong>Reading Time:</strong> ${blogPost.readingTime} minutes</p>
        </div>
        
        ${blogPost.content}
        
        <div class="footer">
            <p>Generated by AutoBlog AI on ${blogPost.createdAt.toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;

    return Buffer.from(htmlContent, 'utf-8');
  }
} 