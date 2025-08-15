import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { PresentationSlide } from '../common/interfaces/poll.interface';

@Injectable()
export class PresentationService {
  private currentSlideIndex = 0;
  private presentationSlides: PresentationSlide[] = [];

  loadPresentation(filename: string): { slideIndex: number; totalSlides: number; currentSlide: PresentationSlide | null } {
    const filepath = path.join(process.cwd(), 'polls', `${filename}.md`);
    
    if (!fs.existsSync(filepath)) {
      throw new Error('Presentation file not found');
    }
    
    const content = fs.readFileSync(filepath, 'utf8');
    const parsedSlides = this.parsePresentationFile(content);
    
    this.presentationSlides = parsedSlides;
    this.currentSlideIndex = 0;
    
    return {
      slideIndex: this.currentSlideIndex,
      totalSlides: parsedSlides.length,
      currentSlide: parsedSlides[this.currentSlideIndex] || null,
    };
  }

  navigate(direction: 'next' | 'prev'): { slideIndex: number; slide: PresentationSlide; totalSlides: number } {
    if (direction === 'next' && this.currentSlideIndex < this.presentationSlides.length - 1) {
      this.currentSlideIndex++;
    } else if (direction === 'prev' && this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
    
    const currentSlide = this.presentationSlides[this.currentSlideIndex];
    
    return {
      slideIndex: this.currentSlideIndex,
      slide: currentSlide,
      totalSlides: this.presentationSlides.length,
    };
  }

  getCurrentState(): { slideIndex: number; totalSlides: number; currentSlide: PresentationSlide | null } {
    return {
      slideIndex: this.currentSlideIndex,
      totalSlides: this.presentationSlides.length,
      currentSlide: this.presentationSlides[this.currentSlideIndex] || null,
    };
  }

  private parsePresentationFile(content: string): PresentationSlide[] {
    const slides: PresentationSlide[] = [];
    const sections = content.split(/^---$/gm);
    
    sections.forEach((section, index) => {
      const trimmed = section.trim();
      if (!trimmed) return;
      
      let frontmatter: any = {};
      let slideContent = trimmed;
      
      // Check if section starts with YAML frontmatter
      if (trimmed.startsWith('title:') || trimmed.startsWith('type:') || trimmed.includes('\ntitle:') || trimmed.includes('\ntype:')) {
        // This section starts with YAML, find where content begins
        const endOfYaml = trimmed.indexOf('\n---\n');
        if (endOfYaml !== -1) {
          const yamlContent = trimmed.substring(0, endOfYaml);
          slideContent = trimmed.substring(endOfYaml + 5).trim(); // Skip \n---\n
          
          try {
            frontmatter = yaml.parse(yamlContent);
            console.log('Parsed YAML:', yamlContent, 'Result:', frontmatter);
          } catch (e) {
            console.warn('Failed to parse YAML frontmatter:', e);
          }
        } else {
          // YAML without ending ---, treat whole section as YAML
          try {
            frontmatter = yaml.parse(trimmed);
            slideContent = ''; // No content after YAML
            console.log('Parsed YAML (no content):', trimmed, 'Result:', frontmatter);
          } catch (e) {
            console.warn('Failed to parse YAML frontmatter:', e);
            // If YAML parsing fails, treat as regular content
          }
        }
      }
      
      const slide: PresentationSlide = {
        id: index,
        content: slideContent,
        type: frontmatter.type || 'content',
        title: frontmatter.title || this.extractTitle(slideContent),
        ...frontmatter,
      };
      
      if (frontmatter.poll) {
        slide.poll = frontmatter.poll;
      }
      
      console.log(`Slide ${index}:`, {
        title: slide.title,
        type: slide.type,
        hasPoll: !!slide.poll,
        poll: slide.poll,
        contentPreview: slideContent.substring(0, 100)
      });
      
      slides.push(slide);
    });
    
    return slides.filter(slide => slide.content.length > 0);
  }

  private extractTitle(content: string): string {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : 'Untitled Slide';
  }

  getCurrentSlide(): PresentationSlide | null {
    return this.presentationSlides[this.currentSlideIndex] || null;
  }

  replaceQRPlaceholder(content: string, pollId: string, ngrokUrl?: string): string {
    if (!content.includes('{{AUTO_POLL_QR}}')) {
      return content;
    }

    const baseUrl = ngrokUrl || 'http://localhost:3000';
    const voteUrl = `${baseUrl}/vote/${pollId}`;
    const qrImageUrl = `${baseUrl}/api/qr/${pollId}`;
    
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

    return content.replace('{{AUTO_POLL_QR}}', qrHtml);
  }
}