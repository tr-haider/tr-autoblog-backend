import { ContentTrackerRowDto } from '../dto/content-tracker.dto';

const HEADER_MAP: Record<string, keyof ContentTrackerRowDto> = {
  Title: 'title',
  Owner: 'owner',
  Writer: 'writer',
  Status: 'status',
  'Primary keyword': 'primaryKeyword',
  'Secondary Keywords': 'secondaryKeywords',
  'Kinfotech - Suggest Meta Title': 'metaTitle',
  'Kinfotech - Suggested Meta Description': 'metaDescription',
  'Service Page': 'servicePage',
  'Related Blog': 'relatedBlog',
  'Portfolio/Case Study': 'portfolioCaseStudy',
  'eBook Link': 'ebookLink',
  'Other Internal Links (Webinar, Podcast, Speaking event etc.)':
    'otherInternalLinks',
  CTA: 'cta',
  Angle: 'angle',
};

export function mapRawRowToContentTracker(
  raw: Record<string, string>,
): ContentTrackerRowDto {
  const row: ContentTrackerRowDto = {
    title: '',
    owner: '',
    writer: '',
    status: '',
    primaryKeyword: '',
    secondaryKeywords: '',
    metaTitle: '',
    metaDescription: '',
    servicePage: '',
    relatedBlog: '',
    portfolioCaseStudy: '',
    ebookLink: '',
    otherInternalLinks: '',
    cta: '',
    angle: '',
  };

  for (const [header, value] of Object.entries(raw)) {
    const key = HEADER_MAP[header];
    if (key) {
      row[key] = String(value ?? '').trim();
    }
  }

  return row;
}

export function filterContentTrackerRows(
  rows: ContentTrackerRowDto[],
  options: { status?: string; search?: string },
): ContentTrackerRowDto[] {
  let filtered = rows.filter((r) => r.title.length > 0);

  if (options.status) {
    const status = options.status.toLowerCase();
    filtered = filtered.filter(
      (r) => r.status.toLowerCase() === status,
    );
  }

  if (options.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.primaryKeyword.toLowerCase().includes(q) ||
        r.secondaryKeywords.toLowerCase().includes(q) ||
        r.writer.toLowerCase().includes(q),
    );
  }

  return filtered;
}

export function paginateRows<T>(
  rows: T[],
  page: number,
  limit: number,
): { rows: T[]; page: number; limit: number; total: number; totalPages: number } {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * limit;

  return {
    rows: rows.slice(start, start + limit),
    page: safePage,
    limit,
    total,
    totalPages,
  };
}

export function summarizeContentTrackerRows(rows: ContentTrackerRowDto[]) {
  return {
    published: rows.filter((r) => r.status === 'Published').length,
    inProgress: rows.filter((r) => r.status === 'In Progress').length,
  };
}
