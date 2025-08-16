import { Injectable } from '@nestjs/common';
import { MarpService, MarpSlide, MarpPresentation } from '../common/services/marp.service';

@Injectable()
export class PresentationService {
  private currentSlideIndex = 0;
  private presentationSlides: MarpSlide[] = [];
  private presentationMetadata: any = {};
  private presentationCSS: string = '';

  constructor(private readonly marpService: MarpService) {}

  async loadPresentation(filename: string): Promise<{ slideIndex: number; totalSlides: number; currentSlide: MarpSlide | null; css: string }> {
    try {
      const presentation: MarpPresentation = await this.marpService.renderPresentation(filename);
      
      this.presentationSlides = presentation.slides;
      this.presentationMetadata = presentation.metadata;
      this.presentationCSS = presentation.css;
      this.currentSlideIndex = 0;
      
      console.log(`Loaded Marp presentation: ${filename} with ${presentation.totalSlides} slides`);
      presentation.slides.forEach((slide, i) => {
        console.log(`Slide ${i + 1}: ${slide.title} (type: ${slide.type}, hasPoll: ${!!slide.poll})`);
      });
      
      return {
        slideIndex: this.currentSlideIndex,
        totalSlides: presentation.totalSlides,
        currentSlide: presentation.slides[this.currentSlideIndex] || null,
        css: this.presentationCSS,
      };
    } catch (error) {
      console.error('Failed to load Marp presentation:', error);
      throw new Error(`Failed to load presentation: ${error.message}`);
    }
  }

  navigate(direction: 'next' | 'prev'): { slideIndex: number; slide: MarpSlide; totalSlides: number } {
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

  getCurrentState(): { slideIndex: number; totalSlides: number; currentSlide: MarpSlide | null; css: string } {
    return {
      slideIndex: this.currentSlideIndex,
      totalSlides: this.presentationSlides.length,
      currentSlide: this.presentationSlides[this.currentSlideIndex] || null,
      css: this.presentationCSS,
    };
  }



  getCurrentSlide(): MarpSlide | null {
    return this.presentationSlides[this.currentSlideIndex] || null;
  }

  replaceQRPlaceholder(content: string, pollId: string, ngrokUrl?: string): string {
    // Preserve existing ngrok functionality while using Marp service for rendering
    return this.marpService.replacePollPlaceholders(content, pollId, ngrokUrl);
  }
}