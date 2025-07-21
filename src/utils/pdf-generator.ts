import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { Article } from './crawler';

export class PDFGenerator {
  private doc: PDFKit.PDFDocument;
  private outputPath: string;

  constructor(outputPath: string) {
    this.outputPath = outputPath;
    this.doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: '게시글 모음',
        Author: 'Web Crawler',
        Subject: '크롤링된 게시글 PDF',
      }
    });

    // 한글 폰트 설정
    this.doc.registerFont('NanumGothic', path.join(process.cwd(), 'public/fonts/NanumGothic.ttf'));
    this.doc.font('NanumGothic');
  }

  async generatePDF(articles: Article[]): Promise<string> {
    // 목차 생성
    this.generateTableOfContents(articles);

    // 각 게시글 추가
    for (const article of articles) {
      this.addArticle(article);
    }

    // PDF 저장
    const outputStream = fs.createWriteStream(this.outputPath);
    this.doc.pipe(outputStream);
    this.doc.end();

    return new Promise((resolve, reject) => {
      outputStream.on('finish', () => resolve(this.outputPath));
      outputStream.on('error', reject);
    });
  }

  private generateTableOfContents(articles: Article[]) {
    this.doc.fontSize(20).text('목차', { align: 'center' });
    this.doc.moveDown();

    articles.forEach((article, index) => {
      this.doc.fontSize(12)
        .text(`${index + 1}. ${article.title}`, {
          link: `#article-${index}`,
          continued: true
        })
        .text(` (${article.date})`, { link: null });
    });

    this.doc.addPage();
  }

  private async addArticle(article: Article) {
    // 제목 추가
    this.doc.fontSize(16)
      .text(article.title, { align: 'center' })
      .moveDown();

    // 날짜 추가
    this.doc.fontSize(10)
      .text(`작성일: ${article.date}`, { align: 'right' })
      .moveDown();

    // 본문 추가
    this.doc.fontSize(12)
      .text(this.stripHtml(article.content))
      .moveDown();

    // 이미지 추가
    for (const imageUrl of article.images) {
      try {
        const imagePath = path.join(process.cwd(), 'temp', path.basename(imageUrl));
        if (fs.existsSync(imagePath)) {
          this.doc.image(imagePath, {
            fit: [500, 500],
            align: 'center'
          });
          this.doc.moveDown();
        }
      } catch (error) {
        console.error(`Error adding image ${imageUrl}:`, error);
      }
    }

    // 첨부파일 링크 추가
    if (article.attachments.length > 0) {
      this.doc.fontSize(10)
        .text('첨부파일:', { underline: true })
        .moveDown(0.5);

      article.attachments.forEach(attachment => {
        this.doc.text(`- ${path.basename(attachment)}`);
      });
    }

    this.doc.addPage();
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
} 