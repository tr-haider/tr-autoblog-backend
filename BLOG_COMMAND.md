# 📝 Blog Generation Commands

## Quick Start

### Generate Blog & Email to Marketing Team
```bash
npm run blog
```

This command will:
1. ✅ Check if the application is running
2. 🔍 Research trending AI and HIPAA healthcare topics
3. 📝 Generate a professional blog post
4. 📧 Email the blog to your marketing team
5. 📊 Show a summary of the generated content

## Available Commands

### `npm run blog`
- **Purpose**: Generate a trending HIPAA blog and email it to marketing team
- **What it does**: 
  - Researches current trending topics in AI and healthcare
  - Generates a professional blog post using GROQ AI
  - Sends formatted email with blog attachment
  - Shows detailed summary of the generated content

### `npm run blog:trending`
- **Purpose**: Same as `npm run blog` (alias)
- **Use case**: Generate blog from trending topics

### `npm run topics`
- **Purpose**: Research and display trending topics only
- **Use case**: See what topics are currently trending without generating a blog

### `npm run email:test`
- **Purpose**: Test email functionality
- **Use case**: Verify email configuration is working

## Prerequisites

Before running `npm run blog`, make sure you have:

### 1. **Application Running**
```bash
npm run start:dev
```

### 2. **Environment Configuration**
Create a `.env` file with:
```env
# GROQ API Configuration
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-8b-instant
LLM_API_KEY=your_groq_api_key_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Marketing Team Configuration
MARKETING_TEAM_EMAILS=marketing1@company.com,marketing2@company.com

# Application Configuration
PORT=3000
```

## Example Output

When you run `npm run blog`, you'll see:

```
🤖 AutoBlog AI - Generating HIPAA Blog & Emailing to Marketing Team...

1. Checking application status...
✅ Application is running

2. Generating trending HIPAA blog...
✅ Blog generated successfully!
📝 Title: AI-Powered Clinical Decision Support Systems and HIPAA Compliance
📊 Word count: 1200
⏱️ Reading time: 6 minutes
🏷️ Keywords: AI clinical decision support, HIPAA compliance, healthcare AI

3. Emailing blog to marketing team...
✅ Email sent successfully to marketing team!
📧 Message: Weekly blog generation completed successfully

📄 Blog Summary:
============================================================
Title: AI-Powered Clinical Decision Support Systems and HIPAA Compliance
Topic: AI-Powered Clinical Decision Support Systems and HIPAA Compliance
Word Count: 1200
Reading Time: 6 minutes
Keywords: AI clinical decision support, HIPAA compliance, healthcare AI, clinical systems
Status: draft
============================================================

🎉 Blog generation and email distribution completed successfully!
📬 Check your marketing team's email for the new blog post.
```

## Troubleshooting

### Application Not Running
```
❌ Application is not running. Please start it first:
   npm run start:dev
```

### Blog Generation Failed
- Check your GROQ API key is valid
- Ensure you have sufficient GROQ credits
- Verify the API key is in your `.env` file

### Email Sending Failed
- Check email configuration in `.env` file
- Verify Gmail app password (if using Gmail)
- Ensure marketing team emails are correctly formatted

### Common Issues
1. **"GROQ API key not found"** - Add `LLM_API_KEY=your_key` to `.env`
2. **"Email configuration error"** - Check email settings in `.env`
3. **"Port already in use"** - Change PORT in `.env` or stop other services

## What Gets Emailed

The marketing team receives:
- 📧 **Professional HTML email** with blog summary
- 📎 **Blog post attachment** (HTML format)
- 📊 **Metadata** (word count, reading time, keywords)
- 📋 **Next steps** for review and publication
- 🔗 **Internal links** to related resources

## Trending Topics

The system automatically researches and selects from trending topics like:
- AI-Powered Clinical Decision Support Systems
- Generative AI in Healthcare
- Telemedicine AI Solutions
- Machine Learning in Medical Imaging
- AI-Powered Patient Monitoring
- Blockchain and AI in Healthcare
- AI Ethics in Healthcare
- Natural Language Processing in Healthcare

## Next Steps

After running `npm run blog`:
1. 📬 Check your marketing team's email
2. 📝 Review the generated blog post
3. ✏️ Make any necessary edits
4. 📅 Schedule publication
5. 🚀 Publish to your blog platform

Happy blogging! 🤖📝📧 