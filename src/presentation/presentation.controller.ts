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
      return this.presentationService.loadPresentation(filename);
    } catch (error) {
      return { error: error.message };
    }
  }

  @Post('navigate/:direction')
  navigate(@Param('direction') direction: 'next' | 'prev') {
    const result = this.presentationService.navigate(direction);
    const { slideIndex, slide, totalSlides } = result;
    
    // If current slide has a poll, start it
    if (slide?.poll) {
      const poll = this.pollingService.createPoll(slide.poll.question, slide.poll.options);
      poll.slideIndex = slideIndex;
      this.pollingGateway.emitPollStarted(poll);
    }
    
    // Emit slide change event
    this.pollingGateway.emitSlideChanged({ slideIndex, slide, totalSlides });
    
    return result;
  }

  @Get('state')
  getState() {
    return this.presentationService.getCurrentState();
  }
}