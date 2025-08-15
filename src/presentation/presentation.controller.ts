import { Controller, Get, Post, Param } from '@nestjs/common';
import { PresentationService } from './presentation.service';
import { PollingService } from '../polling/polling.service';
import { PollingGateway } from '../polling/polling.gateway';

@Controller('api/presentation')
export class PresentationController {
  constructor(
    private readonly presentationService: PresentationService,
    private readonly pollingService: PollingService,
    private readonly pollingGateway: PollingGateway,
  ) {}

  @Get('load/:filename')
  loadPresentation(@Param('filename') filename: string) {
    try {
      console.log('Loading presentation:', filename);
      const result = this.presentationService.loadPresentation(filename);
      let { slideIndex, totalSlides, currentSlide } = result;
      
      // If the first slide has a poll, start it and replace QR placeholder
      if (currentSlide?.poll) {
        const poll = this.pollingService.createPoll(currentSlide.poll.question, currentSlide.poll.options);
        poll.slideIndex = slideIndex;
        
        // Replace QR placeholder with actual QR code
        const updatedContent = this.presentationService.replaceQRPlaceholder(currentSlide.content, poll.id);
        currentSlide = { ...currentSlide, content: updatedContent };
        
        this.pollingGateway.emitPollStarted(poll);
      }
      
      return {
        slideIndex,
        totalSlides,
        currentSlide
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Post('navigate/:direction')
  navigate(@Param('direction') direction: 'next' | 'prev') {
    const result = this.presentationService.navigate(direction);
    let { slideIndex, slide, totalSlides } = result;
    
    console.log(`Navigated to slide ${slideIndex + 1}: "${slide.title}", hasPoll: ${!!slide?.poll}`);
    
    // If current slide has a poll, start it and replace QR placeholder
    if (slide?.poll) {
      console.log('Found poll slide:', slide.title, slide.poll);
      const poll = this.pollingService.createPoll(slide.poll.question, slide.poll.options);
      poll.slideIndex = slideIndex;
      console.log('Created poll:', poll.id, poll.question);
      
      // For poll slides with empty content, create content with QR code
      let content = slide.content;
      if (!content || content.trim() === '') {
        content = `
# ${slide.title}

**${slide.poll.question}**

**Options:** ${slide.poll.options.join(' • ')}

{{AUTO_POLL_QR}}
        `.trim();
      }
      
      // Replace QR placeholder with actual QR code
      const updatedContent = this.presentationService.replaceQRPlaceholder(content, poll.id);
      console.log('Original content:', content.substring(0, 100));
      console.log('Updated content:', updatedContent.substring(0, 100));
      slide = { ...slide, content: updatedContent };
      
      this.pollingGateway.emitPollStarted(poll);
      console.log('Poll started and emitted');
    }
    
    // Emit slide change event
    this.pollingGateway.emitSlideChanged({ slideIndex, slide, totalSlides });
    
    // Return format that matches frontend expectation
    return {
      slideIndex,
      totalSlides,
      currentSlide: slide
    };
  }

  @Get('state')
  getState() {
    return this.presentationService.getCurrentState();
  }
}