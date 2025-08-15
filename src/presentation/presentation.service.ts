import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { PresentationSlide } from '../common/interfaces/poll.interface';

@Injectable()
export class PresentationService {
  private currentSlideIndex = 0;
  private presentationSlides: PresentationSlide[] = [];

  loadPresentation(filename: string): { polls: PresentationSlide[]; totalSlides: number; currentSlide: number } {
    const filepath = path.join(process.cwd(), 'polls', `${filename}.md`);
    
    if (!fs.existsSync(filepath)) {
      throw new Error('Presentation file not found');
    }
    
    const content = fs.readFileSync(filepath, 'utf8');
    const parsedSlides = this.parsePresentationFile(content);
    
    this.presentationSlides = parsedSlides;
    this.currentSlideIndex = 0;
    
    return {
      polls: parsedSlides,
      totalSlides: parsedSlides.length,
      currentSlide: this.currentSlideIndex,
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
      
      const yamlMatch = trimmed.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      let frontmatter: any = {};
      let slideContent = trimmed;
      
      if (yamlMatch) {
        try {
          frontmatter = yaml.parse(yamlMatch[1]);
          slideContent = yamlMatch[2];
        } catch (e) {
          console.warn('Failed to parse YAML frontmatter:', e);
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
      
      slides.push(slide);
    });
    
    return slides;
  }

  private extractTitle(content: string): string {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : 'Untitled Slide';
  }
}