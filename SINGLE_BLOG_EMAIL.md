# Single Blog Generation and Email Feature

## Overview

The AutoBlog AI system has been updated to generate a single blog post at a time and automatically email it to the marketing team in DOCX format.

## New Endpoints

### 1. Generate and Email Blog
**POST** `/blog-generator/generate-and-email`

Generates a single blog post and emails it to the marketing team with a DOCX attachment.

**Request Body:**
```json
{
  "topic": "HIPAA Compliance Best Practices for Healthcare Software",
  "keywords": ["HIPAA compliance", "healthcare software", "data security", "privacy"],
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
    "id": "blog_1234567890_abc123",
    "title": "🩺 HIPAA Compliance Best Practices for Healthcare Software",
    "content": "...",
    "summary": "...",
    "keywords": ["HIPAA compliance", "healthcare software"],
    "wordCount": 1200,
    "readingTime": 6,
    "topic": "HIPAA Compliance Best Practices",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "generationTime": 5000
}
```

## Configuration

### Email Configuration
Add the following to your configuration file:

```env
# Email settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_AUTH_USER=your-email@gmail.com
EMAIL_AUTH_PASS=your-app-password

# Marketing team email
MARKETING_TEAM_EMAILS=marketing@yourcompany.com,content@yourcompany.com
```

## Testing

### Test Single Blog Generation and Email
```bash
npm run test:blog-email
```

This will:
1. Generate a single blog post
2. Save it as a DOCX file in the `blogs/` folder
3. Email the DOCX file to the marketing team
4. Display the results in the console

### Test Regular Blog Generation (No Email)
```bash
npm run test:blog
```

This will:
1. Generate a single blog post
2. Save it as a DOCX file in the `blogs/` folder
3. Display the results in the console

## Features

### What the System Does:
1. **Generates a single blog post** based on the provided topic and parameters
2. **Saves the blog** as a DOCX file in the `blogs/` folder with timestamp
3. **Emails the DOCX file** to the marketing team with:
   - Professional email template
   - Blog post summary and metadata
   - DOCX attachment ready for review
4. **Logs all activities** for tracking and debugging

### Email Content:
- Professional HTML email template
- Blog post title and summary
- Word count and reading time
- Keywords and topic information
- DOCX attachment for easy review
- Call-to-action for the marketing team

## Removed Features

The following features have been removed to simplify the system:
- Weekly blog generation (multiple blogs at once)
- Weekly blog email functionality
- Bulk blog processing

## Benefits

1. **Simplified Workflow**: Generate one blog at a time for better quality control
2. **Immediate Review**: Marketing team gets notified immediately when a blog is generated
3. **Professional Format**: DOCX format is ready for editing and publishing
4. **Automated Process**: No manual intervention needed after generation
5. **Better Tracking**: Each blog generation is logged and tracked separately

## Troubleshooting

### Email Not Sending
1. Check email configuration in your environment variables
2. Verify SMTP settings are correct
3. Check if your email provider allows app passwords
4. Review server logs for email errors

### Blog Generation Fails
1. Check LLM API configuration
2. Verify API keys are valid
3. Check network connectivity
4. Review server logs for generation errors

### DOCX File Issues
1. Ensure the `blogs/` folder exists and is writable
2. Check file permissions
3. Verify the docx library is properly installed 