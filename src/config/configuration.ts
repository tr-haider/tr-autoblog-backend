export default () => ({
  port: parseInt(process.env.PORT as string, 10) || 3000,
  llm: {
    provider: process.env.LLM_PROVIDER || 'groq', // 'groq', 'openai', 'ollama'
    model: process.env.LLM_MODEL || 'llama-3.1-8b-instant',
    apiKey: process.env.LLM_API_KEY, // Required for cloud providers
    baseUrl: process.env.LLM_BASE_URL, // Optional, for custom endpoints
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT as string, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
  marketing: {
    teamEmails: process.env.MARKETING_TEAM_EMAILS?.split(',') || [],
    weeklySchedule: process.env.WEEKLY_SCHEDULE || '0 9 * * 1', // Monday 9 AM
  },
  blog: {
    topics: [
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
    ],
    seoKeywords: [
      'HIPAA compliance',
      'healthcare AI',
      'medical software',
      'healthcare regulations',
      'AI in healthcare',
      'healthcare data security',
      'medical technology',
      'healthcare innovation',
      'digital health',
      'healthcare privacy',
    ],
    internalLinks: [
      {
        text: 'HIPAA Compliant Mobile App Development Checklist',
        url: 'https://technologyrivers.com/hipaa-compliant-mobile-app-development-checklist/',
        category: 'compliance'
      },
      {
        text: 'Top 8 AI Tools You Need to Know About',
        url: 'https://technologyrivers.com/top-8-ai-tools-you-need-to-know/',
        category: 'ai'
      },
      {
        text: '13 Proven Strategies to Boost Your Mobile App',
        url: 'https://technologyrivers.com/free-app-promotion-playbook/',
        category: 'marketing'
      },
      {
        text: 'AI-Driven Development Services',
        url: 'https://technologyrivers.com/ai-driven-development/',
        category: 'development'
      },
      {
        text: 'HIPAA Compliant AI Healthcare Apps',
        url: 'https://technologyrivers.com/blog/hipaa-compliant-ai-healthcare-apps/',
        category: 'healthcare'
      },
      {
        text: 'Contact Us for Healthcare Software Development',
        url: 'https://technologyrivers.com/contact-us/',
        category: 'contact'
      }
    ] as Array<{text: string; url: string; category: string}>,
    downloadableResources: [
      'HIPAA Compliant Mobile App Development Checklist (Free Download)',
      'Top 8 AI Tools You Need to Know About (Free Guide)',
      '13 Proven Strategies to Boost Your Mobile App (Free Playbook)',
      'AI-Driven Development Services Guide',
      'HIPAA Compliant AI Healthcare Apps Guide',
      'The Ultimate Checklist for Software Development',
      '7 Steps to Developing a HIPAA-Compliant Healthcare App',
      'Top HIPAA Compliant Cloud Hosting for Startup and Enterprise'
    ]
  },
}); 