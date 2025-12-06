export interface BlogPost {
  title: string;
  summary: string;
  content: string;
  topic: string;
  keywords: string[];
  wordCount: number;
  readingTime: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  docxBuffer?: Buffer;
  htmlBuffer?: Buffer;
}

export interface BlogGenerationRequest {
  topic: string;
  keywords?: string[];
  targetWordCount?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'executive';
  includeRegulatoryInfo?: boolean;
  selectedLinks?: string[];
}

export interface BlogGenerationResponse {
  success: boolean;
  blogPost?: BlogPost;
  error?: string;
  generationTime: number;
}

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
} 