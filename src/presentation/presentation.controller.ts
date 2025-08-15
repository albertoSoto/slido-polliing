import { Controller, Get, Post, Param } from '@nestjs/common';
import { PresentationService } from './presentation.service';
import { PollingService } from '../polling/polling.service';
import { PollingGateway } from '../polling/polling.gateway';
import { NgrokService } from '../common/services/ngrok.service';

@Controller('api/presentation')
export class PresentationController {
  constructor(
    private readonly presentationService: PresentationService,
    private readonly pollingService: PollingService,
    private readonly pollingGateway: PollingGateway,
    private readonly ngrokService: NgrokService,
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
    
    console.log(`Navigated to slide ${slideIndex + 1}: "${slide.title}", hasPoll: ${!!slide?.poll}, type: ${slide?.type}`);
    
    // If current slide is a results slide, stop the current poll and show results
    if (slide?.type === 'results') {
      const currentPoll = this.pollingService.getCurrentPoll();
      if (currentPoll) {
        console.log('Stopping poll for results slide:', currentPoll.id);
        this.pollingService.stopPoll(currentPoll.id);
        this.pollingGateway.emitPollStopped(currentPoll);
        
        // Generate results content for empty results slides
        if (!slide.content || slide.content.trim() === '') {
          const resultsContent = `
# ${slide.title}

**Poll Results: ${currentPoll.question}**

**Total Votes: ${currentPoll.totalVotes}**

${currentPoll.options.map(opt => `**${opt.text}:** ${opt.votes} votes`).join('\n\n')}

Check the presenter interface for the live chart!
          `.trim();
          slide = { ...slide, content: resultsContent };
        }
      }
    }
    
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
      
      // Replace QR placeholder with actual QR code - get ngrok URL from service
      const ngrokUrl = this.ngrokService.getPublicUrl() || process.env.NGROK_URL;
      console.log('Using ngrok URL for QR:', ngrokUrl);
      const updatedContent = this.presentationService.replaceQRPlaceholder(content, poll.id, ngrokUrl);
      console.log('Original content length:', content.length, 'contains QR placeholder:', content.includes('{{AUTO_POLL_QR}}'));
      console.log('Updated content length:', updatedContent.length, 'contains img tag:', updatedContent.includes('<img'));
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