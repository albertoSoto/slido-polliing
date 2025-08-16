import { Injectable } from '@nestjs/common';
import { Marp } from '@marp-team/marp-core';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

export interface MarpSlide {
  id: number;
  title: string;
  type: string;
  content: string;
  htmlContent: string;
  poll?: {
    id?: string;
    question: string;
    options: string[];
  };
  resultsFor?: string;
  metadata?: any;
}

export interface MarpPresentation {
  slides: MarpSlide[];
  totalSlides: number;
  metadata: any;
  css: string;
}

@Injectable()
export class MarpService {
  private marp: Marp;

  constructor() {
    // Initialize Marp with enhanced configuration
    this.marp = new Marp({
      html: true,
      markdown: {
        breaks: false,
      },
    });

    // Add enhanced themes and polling features
    this.setupPollingDirectives();
    this.setupCustomThemes();
  }

  async renderPresentation(filename: string): Promise<MarpPresentation> {
    const filepath = path.join(process.cwd(), 'polls', `${filename}.md`);
    
    if (!(await this.fileExists(filepath))) {
      throw new Error(`Presentation file not found: ${filename}.md`);
    }

    const content = await fs.readFile(filepath, 'utf8');
    const processedContent = this.preprocessContent(content);
    
    // Render with Marp
    const { html, css, comments } = this.marp.render(processedContent);
    
    // Parse slides from rendered HTML
    const slides = this.parseRenderedSlides(html, content);
    
    // Add reference to external polling themes CSS
    const enhancedCSS = this.addExternalCSSReference(css);
    
    return {
      slides,
      totalSlides: slides.length,
      metadata: comments,
      css: enhancedCSS,
    };
  }

  private async fileExists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  private preprocessContent(content: string): string {
    // Replace our custom poll placeholders with Marp-compatible content
    let processedContent = content;
    
    // Replace {{AUTO_POLL_QR}} with a custom directive
    processedContent = processedContent.replace(
      /\{\{AUTO_POLL_QR\}\}/g,
      '<!-- poll-qr -->'
    );

    return processedContent;
  }

  private parseRenderedSlides(html: string, originalContent: string): MarpSlide[] {
    const slides: MarpSlide[] = [];
    
    // Split original content by slide separators to extract YAML frontmatter
    const contentSections = originalContent.split(/^---$/gm);
    
    // Parse HTML to extract slide content
    const slideElements = this.extractSlideElements(html);
    
    let slideIndex = 0;
    for (let i = 0; i < contentSections.length; i++) {
      const section = contentSections[i].trim();
      if (!section) continue;

      let frontmatter: any = {};
      let slideContent = section;
      
      // Parse YAML frontmatter
      if (this.isYamlFrontmatter(section)) {
        const endOfYaml = section.indexOf('\n---\n');
        if (endOfYaml !== -1) {
          const yamlContent = section.substring(0, endOfYaml);
          slideContent = section.substring(endOfYaml + 5).trim();
          
          try {
            frontmatter = yaml.parse(yamlContent);
          } catch (e) {
            console.warn('Failed to parse YAML frontmatter:', e);
          }
        } else {
          // YAML-only slide
          try {
            frontmatter = yaml.parse(section);
            slideContent = '';
          } catch (e) {
            console.warn('Failed to parse YAML frontmatter:', e);
          }
        }
      }

      // Skip empty slides unless they have special metadata
      if (!slideContent && !frontmatter.type && !frontmatter.poll) {
        continue;
      }

      const slide: MarpSlide = {
        id: slideIndex,
        title: frontmatter.title || this.extractTitle(slideContent),
        type: frontmatter.type || 'content',
        content: slideContent,
        htmlContent: slideElements[slideIndex] || this.renderMarkdown(slideContent),
        metadata: frontmatter,
      };

      // Add poll configuration
      if (frontmatter.poll) {
        slide.poll = frontmatter.poll;
      }

      // Add results reference
      if (frontmatter.resultsFor !== undefined) {
        slide.resultsFor = frontmatter.resultsFor;
      }

      slides.push(slide);
      slideIndex++;
    }

    return slides.filter(slide => 
      slide.content.length > 0 || 
      slide.poll || 
      slide.type === 'results' || 
      slide.type === 'intro' || 
      slide.type === 'conclusion'
    );
  }

  private isYamlFrontmatter(section: string): boolean {
    return section.startsWith('title:') || 
           section.startsWith('type:') || 
           section.includes('\ntitle:') || 
           section.includes('\ntype:');
  }

  private extractSlideElements(html: string): string[] {
    // Extract individual slide content from Marp-rendered HTML
    const slideRegex = /<section[^>]*>([\s\S]*?)<\/section>/g;
    const slides: string[] = [];
    let match;

    while ((match = slideRegex.exec(html)) !== null) {
      slides.push(match[1]);
    }

    return slides;
  }

  private extractTitle(content: string): string {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].replace(/[🎉📊💻📱]/g, '').trim() : 'Untitled Slide';
  }

  private renderMarkdown(content: string): string {
    // Basic markdown rendering for fallback
    return content
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  private setupPollingDirectives(): void {
    // Add custom Marp directives for polling features
    // CSS themes are now managed in external file: public/css/marp-polling-themes.css
  }

  private setupCustomThemes(): void {
    // Apply custom HTML processing for enhanced polling features
    this.marp.use((md) => {
      // Add custom HTML wrapper for QR code placeholders
      md.renderer.rules.html_block = (tokens, idx, options, env, renderer) => {
        const token = tokens[idx];
        if (token.content.includes('<!-- poll-qr -->')) {
          return '<div class="poll-qr-container"><!-- poll-qr --></div>';
        }
        return token.content;
      };
    });
  }

  private addExternalCSSReference(originalCSS: string): string {
    // Add reference to external polling themes CSS file
    const cssImport = '@import url("/css/marp-polling-themes.css");';
    return cssImport + '\n' + originalCSS;
  }

  replacePollPlaceholders(htmlContent: string, pollId: string, ngrokUrl?: string): string {
    // Replace both {{AUTO_POLL_QR}} and <!-- poll-qr --> with actual QR code HTML
    // This preserves the existing ngrok functionality while adding Marp support
    const baseUrl = ngrokUrl || process.env.NGROK_URL || 'http://localhost:3000';
    const voteUrl = `${baseUrl}/vote/${pollId}`;
    const qrImageUrl = `http://localhost:3000/api/qr/${pollId}`; // QR served locally but contains ngrok URL
    
    const qrHtml = `
<div style="text-align: center; margin: 2rem 0;">
  <div style="background: white; padding: 20px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <img src="${qrImageUrl}" alt="QR Code for voting" style="width: 300px; height: 300px; display: block;">
  </div>
  <p style="margin-top: 1rem; font-size: 1.2rem; color: #666;">
    <strong>Scan to vote:</strong> <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px;">${voteUrl}</code>
  </p>
</div>
    `.trim();

    // Replace both old and new placeholder formats
    return htmlContent
      .replace(/\{\{AUTO_POLL_QR\}\}/g, qrHtml)
      .replace(/<!-- poll-qr -->/g, qrHtml);
  }
}