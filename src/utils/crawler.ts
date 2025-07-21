export interface Article {
  title: string;
  content: string;
  date: string;
  images: string[];
  attachments: string[];
  url?: string;
  author?: string;
}

export interface CrawledContent {
  title: string;
  content: string;
  url: string;
  date?: string;
  metadata?: any;
}

export interface CrawlerConfig {
  baseUrl: string;
  selectors: {
    title: string;
    content: string;
    date: string;
    images: string;
    attachments: string;
  };
  maxPages?: number;
  delay?: number;
}

export class WebCrawler {
  private config: CrawlerConfig;

  constructor(config: CrawlerConfig) {
    this.config = config;
  }

  async crawl(): Promise<Article[]> {
    // 기본 구현 - 실제 크롤링은 서버 환경에서 구현
    return [];
  }

  async crawlPage(url: string): Promise<Article | null> {
    try {
      // 기본 구현 - 실제 크롤링은 서버 환경에서 구현
      return null;
    } catch (error) {
      console.error('Error crawling page:', error);
      return null;
    }
  }

  private parseArticle(html: string): Article | null {
    // HTML 파싱 로직 - 실제 구현은 서버 환경에서 구현
    return null;
  }
}
