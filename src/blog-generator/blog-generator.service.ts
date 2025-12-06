import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';
import { ChatGroq } from '@langchain/groq';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { PromptTemplate } from '@langchain/core/prompts';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import {
  BlogPost,
  BlogGenerationRequest,
  BlogGenerationResponse,
} from '../interfaces/blog.interface';
import { EmailService } from '../email-service/email.service';
import { TopicResearchService, TrendingTopic } from '../topic-research/topic-research.service';
import { WebScraperService, ResourceLink } from '../web-scraper/web-scraper.service';

@Injectable()
export class BlogGeneratorService {
  private readonly logger = new Logger(BlogGeneratorService.name);
  private llm: BaseChatModel;

  constructor(
    private configService: ConfigService,
    private emailService: EmailService,
    private topicResearchService: TopicResearchService,
    private webScraperService: WebScraperService,
  ) {
    const provider = this.configService.get<string>('llm.provider') || 'groq';
    const model = this.configService.get<string>('llm.model') || 'llama-3.1-8b-instant';
    const baseUrl = this.configService.get<string>('llm.baseUrl');
    const apiKey = this.configService.get<string>('llm.apiKey');

    console.log('provider', provider);
    console.log('model', model);
    console.log('baseUrl', baseUrl);
    console.log('apiKey', apiKey);

    if (provider === 'groq') {
      this.llm = new ChatGroq({
        apiKey,
        model,
        temperature: 0.7,
      });
      this.logger.log(`Initialized GROQ LLM with model: ${model}`);
    } else if (provider === 'ollama') {
      this.llm = new ChatOllama({
        model,
        baseUrl: baseUrl || 'http://localhost:11434',
        temperature: 0.7,
      });
      this.logger.log(`Initialized Ollama LLM with model: ${model}`);
    } else if (provider === 'openai') {
      this.llm = new ChatOpenAI({
        apiKey: apiKey,
        modelName: model,
        temperature: 0.7,
      });
      this.logger.log(`Initialized OpenAI LLM with model: ${model}`);
    } else {
      throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  async generateBlogPost(request: BlogGenerationRequest): Promise<BlogGenerationResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Generating blog post for topic: ${request.topic}`);
      
      const prompt = await this.createBlogPrompt(request);
      const response = await this.llm.invoke(prompt);
      
      // Debug: Log the raw LLM response
      this.logger.debug('Raw LLM response:', response.content);
      
      const blogPost = await this.parseBlogResponse(response.content as string, request);
      
      const generationTime = Date.now() - startTime;
      
      this.logger.log(`Blog post generated successfully in ${generationTime}ms`);
      
      return {
        success: true,
        blogPost,
        generationTime,
      };
      
    } catch (error) {
      this.logger.error('Error generating blog post:', error.message);
      return {
        success: false,
        error: error.message,
        generationTime: Date.now() - startTime,
      };
    }
  }

  async generateBlogPostAsDocx(request: BlogGenerationRequest): Promise<BlogGenerationResponse> {
    const result = await this.generateBlogPost(request);
    
    if (result.success && result.blogPost) {
      try {
        const docxBuffer = await this.createDocxDocument(result.blogPost);
        const htmlBuffer = await this.createHtmlDocument(result.blogPost);
        result.blogPost.docxBuffer = docxBuffer;
        result.blogPost.htmlBuffer = htmlBuffer;
        this.logger.log('DOCX and HTML documents created successfully');
      } catch (error) {
        this.logger.error('Error creating documents:', error.message);
        result.success = false;
        result.error = `Failed to create documents: ${error.message}`;
      }
    }
    
    return result;
  }

  async generateAndSaveBlog(request: BlogGenerationRequest): Promise<BlogGenerationResponse> {
    const result = await this.generateBlogPost(request);
    
    if (result.success && result.blogPost) {
      try {
        const filename = `${result.blogPost.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        const filepath = path.join(process.cwd(), 'blogs', filename);
        
        // Ensure blogs directory exists
        const blogsDir = path.dirname(filepath);
        if (!fs.existsSync(blogsDir)) {
          fs.mkdirSync(blogsDir, { recursive: true });
        }
        
        fs.writeFileSync(filepath, JSON.stringify(result.blogPost, null, 2));
        this.logger.log(`Blog saved to: ${filepath}`);
        
      } catch (error) {
        this.logger.error('Error saving blog:', error.message);
        result.success = false;
        result.error = `Failed to save blog: ${error.message}`;
      }
    }
    
    return result;
  }

  async generateAndEmailBlog(request: BlogGenerationRequest): Promise<BlogGenerationResponse> {
    const result = await this.generateBlogPostAsDocx(request);
    
    if (result.success && result.blogPost) {
      const emailSent = await this.emailService.sendBlogToMarketingTeam(result.blogPost);
      
      if (!emailSent) {
        result.success = false;
        result.error = 'Blog generated but failed to send email';
      } else {
        this.logger.log('Blog generated and emailed successfully with DOCX attachment');
      }
    }
    
    return result;
  }

  async generateBlogFromTrendingTopic(): Promise<BlogGenerationResponse> {
    try {
      this.logger.log('Getting random trending topic for blog generation...');
      
      const trendingTopic = await this.topicResearchService.getRandomTrendingTopic();
      
      this.logger.log(`Selected trending topic: ${trendingTopic.title}`);
      
      const request: BlogGenerationRequest = {
        topic: trendingTopic.title,
        keywords: trendingTopic.keywords,
        targetWordCount: 1200,
        tone: 'professional',
        includeRegulatoryInfo: true,
      };
      
      return await this.generateBlogPost(request);
    } catch (error) {
      this.logger.error('Error generating blog from trending topic:', error.message);
      return {
        success: false,
        error: error.message,
        generationTime: 0,
      };
    }
  }

  async generateTrendingBlogs(count: number = 3): Promise<BlogPost[]> {
    const blogs: BlogPost[] = [];

    for (let i = 0; i < count; i++) {
      const result = await this.generateBlogFromTrendingTopic();
      if (result.success && result.blogPost) {
        blogs.push(result.blogPost);
      }
    }

    return blogs;
  }

  async getSeparatedLinks(): Promise<{ resources: ResourceLink[], blogs: ResourceLink[] }> {
    try {
      return await this.webScraperService.getAllLinks();
    } catch (error) {
      this.logger.error('Failed to get separated links:', error.message);
      return {
        resources: await this.webScraperService.scrapeResourceLinks(),
        blogs: await this.webScraperService.scrapeBlogLinks()
      };
    }
  }

  async loadMoreBlogLinks(page: number): Promise<ResourceLink[]> {
    try {
      return await this.webScraperService.scrapeBlogLinksFromPage(page);
    } catch (error) {
      this.logger.error(`Failed to load blog links for page ${page}:`, error.message);
      return [];
    }
  }

  async generateSuggestedTopics(): Promise<any[]> {
    try {
      const prompt = `Generate 8 trending and current software development blog topics focusing on HIPAA compliance, AI integration, and latest technology trends in healthcare software development. Each topic should address real problems faced by healthcare software developers and propose modern technology solutions.

Focus specifically on these areas:
- HIPAA compliance automation with AI/ML
- Healthcare data security using latest technologies
- AI-powered healthcare software solutions
- Cloud-native healthcare applications
- Modern API development for healthcare systems
- Healthcare software testing and validation
- DevOps and CI/CD for healthcare applications
- Latest frameworks and tools for healthcare development
- Blockchain and healthcare data integrity
- IoT and healthcare device integration
- Microservices architecture in healthcare
- Edge computing for healthcare applications

Each topic should be:
1. Relevant to current 2024 technology trends
2. Address specific healthcare/HIPAA challenges
3. Propose AI or modern technology solutions
4. Be actionable for software developers

Return ONLY a JSON array with this exact format:
[
  {
    "title": "[Specific Healthcare Development Problem] with [Latest Technology Solution]",
    "description": "Brief description focusing on the healthcare challenge and modern technology solution",
    "keywords": ["hipaa", "healthcare", "ai", "keyword1", "keyword2"],
    "category": "healthcare-software-development",
    "relevance": 9,
    "trendingLevel": "high"
  }
]

Make sure topics cover:
- At least 3 topics related to HIPAA compliance automation
- At least 2 topics about AI in healthcare software
- At least 2 topics about latest tech trends (2024)
- At least 1 topic about cloud-native healthcare solutions`;

      const response = await this.llm.invoke(prompt);
      const content = response.content as string;

      this.logger.log('Generated topics from LLM:', content.substring(0, 200) + '...');

      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const sanitized = this.sanitizeJsonString(jsonMatch[0]);
        const topics = JSON.parse(sanitized);
        return topics.map((topic: any) => ({
          ...topic,
          source: 'ai-generated',
          generatedAt: new Date().toISOString()
        }));
      }

      // If no JSON found, try to parse the whole response
      try {
        const sanitized = this.sanitizeJsonString(content);
        const topics = JSON.parse(sanitized);
        if (Array.isArray(topics)) {
          return topics.map((topic: any) => ({
            ...topic,
            source: 'ai-generated',
            generatedAt: new Date().toISOString()
          }));
        }
      } catch (parseError) {
        this.logger.warn('Failed to parse LLM response as JSON, using fallback');
      }

      // Fallback if parsing fails - but these should also be AI-generated
      return await this.generateFallbackTopics();
    } catch (error) {
      this.logger.error('Failed to generate AI topics:', error.message);
      return await this.generateFallbackTopics();
    }
  }

  private async generateFallbackTopics(): Promise<any[]> {
    try {
      // Try a simpler prompt for fallback generation
      const fallbackPrompt = `Generate 6 healthcare software development topics with HIPAA and AI focus. Return only JSON array:
[
  {
    "title": "Topic title with HIPAA/AI focus",
    "description": "Brief description",
    "keywords": ["hipaa", "ai", "healthcare", "keyword"],
    "category": "healthcare-software-development",
    "relevance": 8,
    "trendingLevel": "medium"
  }
]`;

      const response = await this.llm.invoke(fallbackPrompt);
      const content = response.content as string;

      // Try to extract JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const sanitized = this.sanitizeJsonString(jsonMatch[0]);
        const topics = JSON.parse(sanitized);
        return topics.map((topic: any) => ({
          ...topic,
          source: 'ai-fallback',
          generatedAt: new Date().toISOString()
        }));
      }
    } catch (error) {
      this.logger.error('AI fallback generation failed:', error.message);
    }

    // Last resort: minimal hardcoded topics with HIPAA/AI focus
    return [
      {
        title: 'Automating HIPAA Compliance Audits with AI-Powered Monitoring Tools',
        description: 'How AI can streamline HIPAA compliance monitoring and reduce manual audit workload',
        keywords: ['hipaa', 'ai', 'compliance', 'automation', 'monitoring'],
        category: 'healthcare-software-development',
        relevance: 10,
        trendingLevel: 'high',
        source: 'emergency-fallback',
        generatedAt: new Date().toISOString()
      },
      {
        title: 'Building AI-Powered Healthcare APIs with FHIR and Cloud Integration',
        description: 'Modern approaches to developing HIPAA-compliant healthcare APIs using AI and cloud technologies',
        keywords: ['hipaa', 'ai', 'fhir', 'apis', 'cloud', 'healthcare'],
        category: 'healthcare-software-development',
        relevance: 9,
        trendingLevel: 'high',
        source: 'emergency-fallback',
        generatedAt: new Date().toISOString()
      },
      {
        title: 'Implementing Zero-Trust Security in Healthcare Software with AI Detection',
        description: 'Using AI-powered threat detection to implement zero-trust security models in healthcare applications',
        keywords: ['hipaa', 'ai', 'zero-trust', 'security', 'healthcare', 'threat-detection'],
        category: 'healthcare-software-development',
        relevance: 9,
        trendingLevel: 'high',
        source: 'emergency-fallback',
        generatedAt: new Date().toISOString()
      },
      {
        title: 'Accelerating HIPAA-Compliant CI/CD Pipelines with AI-Driven Testing',
        description: 'How AI can enhance continuous integration and deployment while maintaining HIPAA compliance',
        keywords: ['hipaa', 'ai', 'cicd', 'testing', 'devops', 'automation'],
        category: 'healthcare-software-development',
        relevance: 8,
        trendingLevel: 'medium',
        source: 'emergency-fallback',
        generatedAt: new Date().toISOString()
      },
      {
        title: 'Real-Time Healthcare Data Processing with Edge AI and HIPAA Compliance',
        description: 'Implementing edge computing and AI for real-time healthcare data processing while maintaining compliance',
        keywords: ['hipaa', 'ai', 'edge-computing', 'real-time', 'healthcare', 'data-processing'],
        category: 'healthcare-software-development',
        relevance: 8,
        trendingLevel: 'high',
        source: 'emergency-fallback',
        generatedAt: new Date().toISOString()
      },
      {
        title: 'Building Microservices Architecture for HIPAA-Compliant Healthcare Platforms',
        description: 'Modern microservices patterns for scalable, compliant healthcare software development',
        keywords: ['hipaa', 'microservices', 'healthcare', 'architecture', 'scalability', 'compliance'],
        category: 'healthcare-software-development',
        relevance: 8,
        trendingLevel: 'medium',
        source: 'emergency-fallback',
        generatedAt: new Date().toISOString()
      }
    ];
  }

  private async createBlogPrompt(request: BlogGenerationRequest): Promise<string> {
    const topics = this.configService.get<string[]>('blog.topics') || [];
    const allKeywords = this.configService.get<string[]>('blog.seoKeywords') || [];
    // Get separated links from web scraper
    const { resources, blogs } = await this.getSeparatedLinks();
    const allLinks = [...resources, ...blogs];

    // Use selected links from request if provided, otherwise use auto-selection
    const relevantLinks = (request.selectedLinks && request.selectedLinks.length > 0)
      ? allLinks.filter(link => request.selectedLinks?.includes(link.url))
      : allLinks.filter(link => 
          request.keywords?.some(keyword => 
            link.title.toLowerCase().includes(keyword.toLowerCase()) ||
            link.description?.toLowerCase().includes(keyword.toLowerCase())
          )
        ).slice(0, 3);



    const prompt = `Generate a professional software development blog post about: ${request.topic}

Write a comprehensive blog post that focuses on a specific software development problem and its solution using AI, modern development techniques, or other technology solutions.

CRITICAL WORD COUNT REQUIREMENT: Write EXACTLY ${request.targetWordCount || 1200} words. This is a strict requirement. The blog content must be approximately ${request.targetWordCount || 1200} words long.

Structure the blog with:

1. Start with <h1> for the main title
2. Write an introduction that identifies the specific problem in software development (150-200 words)
3. Create 3-4 main sections with <h2> headings covering:
   - The problem/challenge in detail (200-300 words)
   - Current solutions and their limitations (200-300 words)
   - Modern technology solutions (AI, APIs, automation, etc.) (300-400 words)
   - Implementation strategies and best practices (200-300 words)
4. Include subsections with <h3> headings where needed
5. Use <ul><li> for bullet points
6. Use <strong> for important terms
7. Include internal links naturally in the content
8. End with a conclusion and call-to-action (100-150 words)
9. The Additional Resources section will be automatically added at the end based on user selections

IMPORTANT: The content must start with <h1>Main Title</h1> followed by the introduction paragraph.

Available internal links to include: ${relevantLinks.map(l => `${l.title} (${l.url})`).join(', ')}

Keywords to include: ${request.keywords?.join(', ') || 'healthcare technology, AI, compliance'}

WORD COUNT TARGET: ${request.targetWordCount || 1200} words - ENSURE THE BLOG IS THIS LENGTH!

IMPORTANT: DO NOT include any "Additional Resources" section in your response - this will be automatically appended based on the user's selected resources from the UI.

Return ONLY a valid JSON object. DO NOT include the word count as a hardcoded number - I will calculate it from the actual content:
{
  "title": "Professional title about ${request.topic}",
  "summary": "2-3 sentence summary",
  "content": "Full HTML content with proper structure including <h1>, <h2>, <h3>, <p>, <ul><li> tags - MUST BE EXACTLY ${request.targetWordCount || 1200} WORDS (without Additional Resources section)",
  "topic": "${request.topic}",
  "keywords": ${JSON.stringify(request.keywords || ['healthcare', 'compliance'])},
  "status": "draft",
  "createdAt": "2024-01-01T00:00:00.000Z"
}`;

    return prompt;
  }

  /**
   * Sanitizes JSON string by properly escaping control characters in string values
   * This fixes issues where LLM returns JSON with unescaped newlines, tabs, etc.
   */
  private sanitizeJsonString(jsonStr: string): string {
    try {
      // First, try parsing as-is
      JSON.parse(jsonStr);
      return jsonStr;
    } catch (e) {
      // If parsing fails, sanitize control characters in string values
      let result = '';
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        const prevChar = i > 0 ? jsonStr[i - 1] : '';
        
        if (escapeNext) {
          result += char;
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          result += char;
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && prevChar !== '\\') {
          inString = !inString;
          result += char;
          continue;
        }
        
        if (inString) {
          // Inside a string, escape control characters
          const controlCharMap: { [key: string]: string } = {
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t',
            '\f': '\\f',
            '\b': '\\b',
            '\v': '\\v',
          };
          
          if (controlCharMap[char]) {
            result += controlCharMap[char];
          } else {
            result += char;
          }
        } else {
          // Outside a string, keep as-is
          result += char;
        }
      }
      
      return result;
    }
  }

  private async parseBlogResponse(response: string, request: BlogGenerationRequest): Promise<BlogPost> {
    try {
      // Try to extract JSON from the response
      let jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      let jsonStr = jsonMatch[0];
      
      // Clean up common LLM response artifacts
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // Sanitize control characters in JSON string values
      // This fixes issues with unescaped newlines, tabs, etc. in string literals
      jsonStr = this.sanitizeJsonString(jsonStr);
      
      const parsed = JSON.parse(jsonStr);
      
      // Validate required fields
      if (!parsed.title || !parsed.content) {
        throw new Error('Missing required fields in parsed response');
      }

      // Get dynamic resources section based on user selections
      const { resources } = await this.getSeparatedLinks();
      const selectedResources = (request.selectedLinks && request.selectedLinks.length > 0)
        ? resources.filter(resource => request.selectedLinks?.includes(resource.url))
        : resources.filter(resource =>
            request.keywords?.some(keyword =>
              resource.title.toLowerCase().includes(keyword.toLowerCase()) ||
              resource.description?.toLowerCase().includes(keyword.toLowerCase())
            )
          ).slice(0, 3);

      // Build the dynamic resources section
      let resourcesSection = '';
      if (selectedResources.length > 0) {
        resourcesSection = `
<h2>Additional Resources for Healthcare Tech Teams</h2>
<p>Ready to take your healthcare software development to the next level? Explore these comprehensive resources:</p>
<ul>
${selectedResources.map(resource => `<li><a href="${resource.url}">${resource.title}</a> - ${resource.description || 'Essential resource for healthcare technology teams'}</li>`).join('\n')}
</ul>
<p>Need expert guidance for your healthcare software project? <a href="https://technologyrivers.com/contact-us/">Contact our team</a> for a complimentary consultation.</p>`;
      } else {
        // Fallback to default resources if none selected
        resourcesSection = `
<h2>Additional Resources for Healthcare Tech Teams</h2>
<p>Ready to take your healthcare software development to the next level? Explore these comprehensive resources:</p>
<ul>
<li><a href="https://technologyrivers.com/the-ultimate-checklist-for-software-development/">The Ultimate Checklist for Software Development</a> - Essential guidelines for successful software projects</li>
<li><a href="https://technologyrivers.com/blog/7-steps-to-developing-a-hipaa-compliant-healthcare-app/">7 Steps to Developing a HIPAA-Compliant Healthcare App</a> - Step-by-step guide for compliance</li>
<li><a href="https://technologyrivers.com/blog/top-hipaa-compliant-cloud-hosting-for-startup-and-enterprise/">Top HIPAA Compliant Cloud Hosting for Startup and Enterprise</a> - Secure hosting solutions</li>
</ul>
<p>Need expert guidance for your healthcare software project? <a href="https://technologyrivers.com/contact-us/">Contact our team</a> for a complimentary consultation.</p>`;
      }

      // Append the resources section to the content
      const finalContent = parsed.content + resourcesSection;

      // Calculate actual word count from final content
      const actualWordCount = this.calculateWordCount(finalContent);
      const actualReadingTime = this.calculateReadingTime(finalContent);

      return {
        title: parsed.title,
        summary: parsed.summary || 'Generated blog post summary',
        content: finalContent,
        topic: parsed.topic || request.topic,
        keywords: parsed.keywords || request.keywords || [],
        wordCount: actualWordCount,
        readingTime: actualReadingTime,
        status: 'draft',
        createdAt: new Date(),
      };
      
    } catch (error) {
      this.logger.error('Failed to parse blog response:', error.message);
      
      // Fallback: create a basic blog post
      return {
        title: `Blog Post: ${request.topic}`,
        summary: 'Generated blog post about healthcare technology and compliance.',
        content: `<h1>${request.topic}</h1><p>This is a generated blog post about ${request.topic.toLowerCase()}.</p>`,
        topic: request.topic,
        keywords: request.keywords || [],
        wordCount: 100,
        readingTime: 1,
        status: 'draft',
        createdAt: new Date(),
      };
    }
  }

  private async createDocxDocument(blogPost: BlogPost): Promise<Buffer> {
    const children: Paragraph[] = [];

    // Add title
    children.push(new Paragraph({
      text: blogPost.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }));

    // Add metadata section
    children.push(new Paragraph({
      text: `Summary: ${blogPost.summary}`,
      spacing: { after: 200 },
    }));

    children.push(new Paragraph({
      text: `Topic: ${blogPost.topic}`,
      spacing: { after: 200 },
    }));

    children.push(new Paragraph({
      text: `Keywords: ${blogPost.keywords.join(', ')}`,
      spacing: { after: 400 },
    }));

    // Parse HTML content properly
    const content = blogPost.content;
    
    // Remove the title h1 since we already added it
    const contentWithoutTitle = content.replace(/<h1>.*?<\/h1>/i, '');
    
    // Split content into HTML elements using regex
    const htmlElements = this.parseHtmlToElements(contentWithoutTitle);
    
    for (const element of htmlElements) {
      switch (element.type) {
        case 'h2':
          children.push(new Paragraph({
            text: element.text,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }));
          break;
          
        case 'h3':
          children.push(new Paragraph({
            text: element.text,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 300, after: 200 },
          }));
          break;
          
        case 'p':
          if (element.text.trim()) {
            const textRuns = this.parseTextWithFormatting(element.text);
            children.push(new Paragraph({
              children: textRuns,
              spacing: { before: 200, after: 200 },
            }));
          }
          break;
          
        case 'ul':
          // Process list items
          for (const listItem of element.items || []) {
            const textRuns = this.parseTextWithFormatting(listItem);
            children.push(new Paragraph({
              children: [new TextRun({ text: '• ' }), ...textRuns],
              spacing: { before: 100, after: 100 },
              indent: { left: 720 }, // Indent list items
            }));
          }
          break;
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  private parseHtmlToElements(html: string): Array<{type: string, text: string, items?: string[]}> {
    const elements: Array<{type: string, text: string, items?: string[]}> = [];
    
    // Match all HTML elements
    const elementRegex = /<(h[23]|p|ul)(?:[^>]*)>(.*?)<\/\1>/gs;
    let match;
    
    while ((match = elementRegex.exec(html)) !== null) {
      const tagName = match[1];
      const content = match[2];
      
      if (tagName === 'ul') {
        // Extract list items
        const listItems: string[] = [];
        const liRegex = /<li(?:[^>]*)>(.*?)<\/li>/gs;
        let liMatch;
        
        while ((liMatch = liRegex.exec(content)) !== null) {
          listItems.push(this.stripHtmlTags(liMatch[1]));
        }
        
        elements.push({
          type: 'ul',
          text: '',
          items: listItems
        });
      } else {
        elements.push({
          type: tagName,
          text: this.stripHtmlTags(content)
        });
      }
    }
    
    return elements;
  }

  private parseTextWithFormatting(text: string): TextRun[] {
    const textRuns: TextRun[] = [];
    
    // Handle <strong> tags
    const parts = text.split(/(<strong>.*?<\/strong>)/);
    
    for (const part of parts) {
      if (part.startsWith('<strong>') && part.endsWith('</strong>')) {
        const boldText = part.replace(/<\/?strong>/g, '');
        textRuns.push(new TextRun({
          text: boldText,
          bold: true,
        }));
      } else if (part.trim()) {
        // Remove any remaining HTML tags and decode entities
        const cleanText = this.stripHtmlTags(part);
        if (cleanText.trim()) {
          textRuns.push(new TextRun({
            text: cleanText,
          }));
        }
      }
    }
    
    return textRuns.length > 0 ? textRuns : [new TextRun({ text: text })];
  }

  private stripHtmlTags(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  private async createHtmlDocument(blogPost: any): Promise<Buffer> {
    try {
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${blogPost.title || 'Blog Post'}</title>
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
            <p><strong>Summary:</strong> ${blogPost.summary || 'Blog summary'}</p>
            <p><strong>Topic:</strong> ${blogPost.topic || 'Blog topic'}</p>
            <p><strong>Keywords:</strong> <span class="keywords">${(blogPost.keywords || []).join(', ')}</span></p>
            <p><strong>Word Count:</strong> ${blogPost.wordCount || 0} | <strong>Reading Time:</strong> ${blogPost.readingTime || 1} minutes</p>
        </div>
        
        ${blogPost.content || '<p>No content available</p>'}
        
        <div class="footer">
            <p>Generated by AutoBlog AI on ${blogPost.createdAt ? new Date(blogPost.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;

      return Buffer.from(htmlContent, 'utf-8');
    } catch (error) {
      this.logger.error('Error in createHtmlDocument:', error);
      throw error;
    }
  }

  async createDocxFromBlog(blogPost: any): Promise<Buffer> {
    return this.createDocxDocument(blogPost);
  }

  async createHtmlFromBlog(blogPost: any): Promise<Buffer> {
    try {
      return this.createHtmlDocument(blogPost);
    } catch (error) {
      this.logger.error('Failed to create HTML document:', error.message);
      throw new Error('Failed to generate HTML document');
    }
  }

  private calculateWordCount(content: string): number {
    return content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  }

  private calculateReadingTime(content: string): number {
    const wordCount = this.calculateWordCount(content);
    return Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute
  }
} 