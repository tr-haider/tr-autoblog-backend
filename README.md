# AutoBlog AI - Backend API

🚀 **NestJS backend for AI-powered blog generation with HIPAA compliance focus.***

## 🎯 Features

- **AI-Powered Content Generation**: Uses GROQ/Llama models for creating healthcare-focused blog posts
- **Smart Topic Suggestions**: LLM-generated trending topics for HIPAA, AI, and latest tech trends
- **Dynamic Resource Integration**: Web scraping of Technology Rivers links with user selection
- **Professional Formatting**: HTML-structured blogs with proper headings, lists, and links
- **Multiple Export Formats**: Generate DOCX or HTML with preserved formatting
- **Email Automation**: Automated email distribution for blog posts
- **Scheduled Tasks**: Automated blog generation and distribution workflows

## 🏗️ Architecture

```
src/
├── blog-generator/      # Core blog generation service
├── web-scraper/         # Technology Rivers link scraping
├── email-service/       # Email automation
├── topic-research/       # Trending topic research
├── scheduler/           # Scheduled task management
├── config/              # Configuration management
├── dto/                 # Data transfer objects
└── interfaces/         # TypeScript interfaces
```

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Create `.env` file in the root directory:

```bash
# LLM Configuration (GROQ recommended)
LLM_PROVIDER=groq
LLM_API_KEY=your_groq_api_key_here
LLM_MODEL=llama-3.1-8b-instant
LLM_BASE_URL=  # Optional, for custom endpoints

# Server Configuration
PORT=3000

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Marketing Team Configuration
MARKETING_TEAM_EMAILS=email1@example.com,email2@example.com
WEEKLY_SCHEDULE=0 9 * * 1  # Monday 9 AM (cron format)
```

### 3. Start the Server

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## 🌐 API Endpoints

### Blog Generation
- `POST /blog-generator/generate` - Generate blog from topic
- `POST /blog-generator/generate-docx` - Generate and return DOCX
- `POST /blog-generator/download-docx` - Download blog as DOCX
- `POST /blog-generator/download-html` - Download blog as HTML
- `POST /blog-generator/generate-and-save` - Generate and save to file
- `POST /blog-generator/generate-and-email` - Generate and email blog
- `POST /blog-generator/generate-trending` - Generate from trending topics
- `POST /blog-generator/generate-trending-weekly` - Generate weekly digest

### Topic Management
- `GET /blog-generator/topics` - Get available topics
- `GET /blog-generator/suggested-topics` - Get AI-generated topic suggestions

### Resource Management
- `GET /blog-generator/separated-links` - Get Technology Rivers resources and blog links
- `GET /blog-generator/load-more-blogs/:page` - Load additional blog pages

### Health Check
- `GET /blog-generator/health` - Health check endpoint

### Topic Research
- `GET /topic-research/trending` - Get trending topics
- `GET /topic-research/random` - Get random topic

### Scheduler
- `POST /scheduler/trigger-weekly` - Trigger weekly blog generation
- `POST /scheduler/trigger-daily` - Trigger daily blog generation
- `GET /scheduler/status` - Get scheduler status

## 🔧 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start:prod` | Start production server |
| `npm run start:debug` | Start in debug mode |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

### CLI Commands

```bash
# Generate single blog from trending topic
npm run blog:single

# Generate multiple blogs for weekly digest
npm run blog

# Test blog format
npm run blog:format

# Test email functionality
npm run email:test
```

## 📚 API Documentation

### Generate Blog Request

```typescript
POST /blog-generator/generate
Content-Type: application/json

{
  "topic": "HIPAA Compliance Best Practices",
  "keywords": ["hipaa", "compliance", "healthcare"],
  "wordCount": 2000,
  "selectedLinks": ["https://example.com/resource1"],
  "tone": "professional"
}
```

### Generate Blog Response

```typescript
{
  "success": true,
  "blogPost": {
    "title": "Blog Title",
    "summary": "Blog summary",
    "content": "<h1>Blog Content</h1>...",
    "topic": "HIPAA Compliance",
    "keywords": ["hipaa", "compliance"],
    "wordCount": 2000,
    "readingTime": 8,
    "status": "draft",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "generationTime": 3500
}
```

## 🔒 Security & Compliance

- **HIPAA-Focused Content**: All topics and examples target healthcare compliance
- **Secure API Keys**: Environment-based configuration
- **Input Validation**: Comprehensive DTO validation with class-validator
- **Error Handling**: Graceful fallbacks and user-friendly error messages
- **CORS Configuration**: Configurable CORS for frontend integration

## 🚦 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's running on port 3000
lsof -i :3000

# Kill existing process
kill -9 $(lsof -t -i:3000)
```

**Environment variables:**
```bash
# Verify environment variables are loaded
node -e "console.log(process.env.LLM_API_KEY)"
```

**Dependencies:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📦 Dependencies

### Core
- **NestJS**: Progressive Node.js framework
- **TypeScript**: Type-safe JavaScript
- **LangChain**: LLM integration framework
- **GROQ/OpenAI**: AI model providers

### Utilities
- **Cheerio**: Web scraping
- **Axios**: HTTP client
- **docx**: DOCX file generation
- **Nodemailer**: Email sending

## 🔮 Future Enhancements

- [ ] Database integration for blog storage
- [ ] User authentication and multi-tenancy
- [ ] Advanced SEO analytics
- [ ] Social media integration
- [ ] Automated publishing workflows
- [ ] Docker containerization
- [ ] API rate limiting
- [ ] Caching layer

---

**Built with**: NestJS, TypeScript, LangChain, GROQ/Llama

**License**: MIT
