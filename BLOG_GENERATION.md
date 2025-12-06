# Blog Generation & Saving Guide

## 🚀 Overview

The AutoBlog AI system now supports generating and saving blog posts directly to the local `blogs/` folder. Each blog is saved in multiple formats for maximum flexibility.

## 📁 File Structure

When you generate a blog, it creates a single DOCX file in the `blogs/` folder:

```
blogs/
└── 2024-08-04T17-42-12-123Z_hipaa_compliance_best_practices.docx
```

### File Type:
- **`.docx`** - Microsoft Word document with professional formatting

## 🛠️ API Endpoints

### 1. Generate and Save Single Blog
```bash
POST /blog-generator/generate-and-save
```

**Request Body:**
```json
{
  "topic": "HIPAA Compliance Best Practices for Healthcare Software",
  "keywords": ["HIPAA compliance", "healthcare software", "data security"],
  "targetWordCount": 1200,
  "tone": "professional",
  "includeRegulatoryInfo": true
}
```

**Response:**
```json
{
  "success": true,
  "blogPost": {
    "id": "blog_1703123456789_abc123def",
    "title": "Complete Guide to HIPAA Compliance in Healthcare Software Development",
    "content": "...",
    "summary": "...",
    "keywords": ["HIPAA compliance", "healthcare software"],
    "wordCount": 1250,
    "readingTime": 6,
    "topic": "HIPAA Compliance Best Practices",
    "createdAt": "2024-08-04T17:42:12.123Z"
  },
  "generationTime": 4500
}
```

### 2. Generate and Save Weekly Blogs
```bash
POST /blog-generator/generate-weekly-and-save?count=3
```

**Response:**
```json
{
  "success": true,
  "blogs": [...],
  "savedFiles": [
    "blogs/2024-08-04T17-42-12-123Z_blog1.docx",
    "blogs/2024-08-04T17-42-12-124Z_blog2.docx"
  ]
}
```

## 🧪 Testing

### Quick Test
```bash
npm run test:blog
```

This will:
1. Generate a single blog post about HIPAA compliance
2. Generate 2 weekly blog posts
3. Save all blogs as DOCX files to the `blogs/` folder
4. Display results in the console

### Manual Testing
```bash
# Start the server
npm run start:dev

# In another terminal, run the test
npm run test:blog
```

## 📝 Blog Content Features

### Generated Content Includes:
- **SEO-optimized titles** and content
- **Professional healthcare terminology**
- **Internal links** to Technology Rivers resources
- **Regulatory compliance information** (HIPAA, FDA, etc.)
- **Actionable insights** and best practices
- **Call-to-action sections**

### Content Structure:
1. **Title** - SEO-optimized and compelling
2. **Summary** - 2-3 sentence overview
3. **Introduction** - Context and problem statement
4. **Main Content** - Detailed sections with headers
5. **Conclusion** - Summary and next steps
6. **Metadata** - Keywords, tags, word count, reading time

## 📄 DOCX Output Features

The generated DOCX files include:
- **Professional formatting** with proper headings and structure
- **Clean typography** and spacing
- **Metadata section** with topic, word count, and keywords
- **Table of contents** for easy navigation
- **Summary section** for quick overview
- **Footer with generation info**

## 📊 Available Topics

The system can generate content on:
- HIPAA Compliance Best Practices
- Healthcare AI Trends
- Regulatory Updates
- Data Security in Healthcare
- AI in Medical Imaging
- Telemedicine Regulations
- Healthcare Data Privacy
- AI Ethics in Healthcare
- Digital Health Innovation
- Healthcare Cybersecurity

## 🔧 Configuration

### Environment Variables
```env
# LLM Configuration
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-8b-instant
LLM_API_KEY=your-api-key

# Blog Configuration
MARKETING_TEAM_EMAILS=team@example.com
WEEKLY_SCHEDULE=0 9 * * 1
```

### Custom Topics
Add custom topics in `src/config/configuration.ts`:
```typescript
blog: {
  topics: [
    'Your Custom Topic 1',
    'Your Custom Topic 2',
    // ... existing topics
  ],
  seoKeywords: [
    'your keyword 1',
    'your keyword 2',
    // ... existing keywords
  ]
}
```

## 🚀 Next Steps

1. **Generate your first blog**: `npm run test:blog`
2. **Check the `blogs/` folder** for generated DOCX files
3. **Open the DOCX files** in Microsoft Word or any compatible editor
4. **Edit the content** as needed for your social media platform
5. **Use the files** for your content marketing strategy

## 📈 Integration with Social Media Platform

This blog generation system can be integrated with your social media automation platform to:
- Generate content for social media posts
- Create blog content for LinkedIn articles
- Provide content for Facebook posts
- Generate Twitter threads from blog content
- Create content calendars automatically

The generated blogs provide a solid foundation for your social media content strategy! 