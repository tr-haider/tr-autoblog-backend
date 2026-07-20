export interface BlogPromptLink {
  title: string;
  url: string;
}

export interface BlogGenerationPromptParams {
  topic: string;
  tone: string;
  wordCount: number;
  minWordCount: number;
  includeRegulatoryInfo: boolean;
  primaryKeyword: string;
  secondaryKeywords: string[];
  keywords: string[];
  metaTitle?: string;
  metaDescription?: string;
  angle?: string;
  cta?: string;
  relevantLinks: BlogPromptLink[];
  createdAt: string;
}

function wordRange(total: number, share: number, floor = 60): string {
  const base = Math.max(floor, Math.round(total * share));
  const high = Math.round(base * 1.15);
  return `${base}-${high}`;
}

function buildScaledContentStructure(
  wordCount: number,
  minWordCount: number,
  primaryKeyword: string,
  conclusionCta: string,
): string {
  return `<h1>[SEO-optimized title containing "${primaryKeyword}"]</h1>
<p>[Hook + problem statement — ${wordRange(wordCount, 0.12)} words. Mention "${primaryKeyword}" within the first 100 words.]</p>

<p>[${wordRange(wordCount, 0.2)} words explaining the problem with real-world healthcare software examples and consequences of inaction]</p>

<p>[${wordRange(wordCount, 0.2)} words on existing approaches, tools, and why they fall short for modern healthcare teams]</p>

<p>[${wordRange(wordCount, 0.25)} words covering AI, automation, APIs, cloud infrastructure, and modern development approaches with specific technologies and actionable implementation guidance]</p>

<p>[${wordRange(wordCount, 0.15)} words with actionable best practices — use a bulleted list for key recommendations]</p>

<p>[${wordRange(wordCount, 0.08, 80)} words summarizing key takeaways${conclusionCta}]</p>

CRITICAL LENGTH CHECK: The HTML in "content" MUST be at least ${minWordCount} words (target ${wordCount}). Do not stop early. Expand sections with examples, data, and technical depth until the minimum is met.`;
}

export function buildBlogGenerationPrompt(params: BlogGenerationPromptParams): string {
  const {
    topic,
    tone,
    wordCount,
    minWordCount,
    includeRegulatoryInfo,
    primaryKeyword,
    secondaryKeywords,
    keywords,
    metaTitle,
    metaDescription,
    angle,
    cta,
    relevantLinks,
    createdAt,
  } = params;

  const seoBrief: string[] = [];
  if (metaTitle) seoBrief.push(`Target SEO Meta Title: ${metaTitle}`);
  if (metaDescription) seoBrief.push(`Target SEO Meta Description: ${metaDescription}`);
  if (angle) seoBrief.push(`Content Angle / Unique Perspective: ${angle}`);
  if (cta) seoBrief.push(`Call-to-Action for conclusion: ${cta}`);

  const regulatoryBlock =
    includeRegulatoryInfo !== false
      ? `\nREGULATORY CONTEXT: Include HIPAA compliance considerations, healthcare data security best practices, and relevant regulatory guidance where applicable. Be specific — mention concrete requirements, not vague warnings.`
      : '';

  const internalLinksBlock =
    relevantLinks.length > 0
      ? relevantLinks.map((l) => `- "${l.title}" → ${l.url}`).join('\n')
      : '- Include relevant Technology Rivers healthcare software links where appropriate';

  const metaTitleRule = metaTitle
    ? `7. The H1 title must closely match: "${metaTitle}"`
    : '';
  const metaDescriptionRule = metaDescription
    ? `8. The opening paragraph must convey: "${metaDescription}"`
    : '';

  const conclusionCta = cta
    ? ` and ending with this call-to-action: ${cta}`
    : ' with a call-to-action to contact Technology Rivers for expert healthcare software guidance';

  return `You are an expert healthcare software development content writer and SEO strategist.

TOPIC: ${topic}
TONE: ${tone}
TARGET LENGTH: ${wordCount} words (HARD MINIMUM: ${minWordCount}+ words in the HTML content body — never submit a shorter article)${regulatoryBlock}

${seoBrief.length > 0 ? `SEO BRIEF FROM CONTENT PLANNER:\n${seoBrief.join('\n')}\n` : ''}PRIMARY KEYWORD: "${primaryKeyword}"
SECONDARY KEYWORDS: ${secondaryKeywords.length > 0 ? secondaryKeywords.join(', ') : 'Use topic-related healthcare and technology terms'}

SEO REQUIREMENTS (MUST FOLLOW ALL):
1. Place "${primaryKeyword}" in the H1 title and the first paragraph
2. Use each secondary keyword naturally at least once in the body
3. Use descriptive headings where they improve scannability — avoid generic titles like "Introduction" or "Conclusion"
4. Keep paragraphs 3-5 sentences each for readability and scannability
5. Include at least 2 bulleted lists with 4-6 substantive items each
6. Do NOT include a FAQ section
${metaTitleRule}
${metaDescriptionRule}

INTERNAL LINKS (weave 2-3 naturally into body paragraphs using descriptive anchor text):
${internalLinksBlock}

CONTENT STRUCTURE (use as a flexible guide — word counts per section scale to the ${wordCount}-word target):

${buildScaledContentStructure(wordCount, minWordCount, primaryKeyword, conclusionCta)}

WRITING QUALITY RULES:
- Be specific and descriptive — use concrete examples, technical details, and industry terminology
- Avoid filler phrases ("In today's world", "It goes without saying", "At the end of the day")
- Write for software developers, CTOs, and healthcare tech decision-makers
- Use <strong> for key terms and important concepts throughout
- Do NOT include an "Additional Resources" section — it will be added automatically after generation

OUTPUT: Return ONLY a valid JSON object (no markdown code fences, no commentary):
{
  "title": "SEO-optimized title with primary keyword",
  "summary": "2-3 sentence meta description-style summary under 160 characters",
  "content": "Full HTML content with h1, h2, h3, p, ul, li, strong, and a tags — MUST be at least ${minWordCount} words",
  "topic": "${topic}",
  "keywords": ${JSON.stringify(keywords.length > 0 ? keywords : ['healthcare', 'compliance'])},
  "status": "draft",
  "createdAt": "${createdAt}"
}`;
}

// primary and secondary keywords

export const SUGGESTED_TOPICS_PROMPT = `Generate 8 trending and current software development blog topics focusing on HIPAA compliance, AI integration, and latest technology trends in healthcare software development. Each topic should address real problems faced by healthcare software developers and propose modern technology solutions.

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

export const FALLBACK_TOPICS_PROMPT = `Generate 6 healthcare software development topics with HIPAA and AI focus. Return only JSON array:
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
