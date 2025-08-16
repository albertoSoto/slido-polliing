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
  async loadPresentation(@Param('filename') filename: string) {
    try {
      console.log('Loading presentation:', filename);
      const result = await this.presentationService.loadPresentation(filename);
      let { slideIndex, totalSlides, currentSlide, css } = result;
      
      // If the first slide has a poll, start it and replace QR placeholder
      if (currentSlide?.poll) {
        const poll = this.pollingService.createPoll(currentSlide.poll.question, currentSlide.poll.options);
        poll.slideIndex = slideIndex;
        
        // Replace QR placeholder with actual QR code in HTML content
        const ngrokUrl = this.ngrokService.getPublicUrl() || process.env.NGROK_URL;
        const updatedHtmlContent = this.presentationService.replaceQRPlaceholder(currentSlide.htmlContent, poll.id, ngrokUrl);
        currentSlide = { ...currentSlide, htmlContent: updatedHtmlContent };
        
        this.pollingGateway.emitPollStarted(poll);
      }
      
      return {
        slideIndex,
        totalSlides,
        currentSlide,
        css
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
          const resultsHtml = `
<h1>${slide.title}</h1>
<h2>Poll Results: ${currentPoll.question}</h2>
<p><strong>Total Votes: ${currentPoll.totalVotes}</strong></p>
${currentPoll.options.map(opt => `<p><strong>${opt.text}:</strong> ${opt.votes} votes</p>`).join('')}
<p><em>Check the presenter interface for the live chart!</em></p>
          `.trim();
          slide = { ...slide, content: resultsContent, htmlContent: resultsHtml };
        }
      }
    }
    
    // If current slide has a poll, start it and replace QR placeholder
    if (slide?.poll) {
      console.log('Found poll slide:', slide.title, slide.poll);
      // Use custom poll ID if provided, otherwise generate one
      const pollId = slide.poll.id || `poll-${Date.now()}`;
      const poll = this.pollingService.createPoll(slide.poll.question, slide.poll.options, pollId);
      poll.slideIndex = slideIndex;
      console.log('Created poll:', poll.id, poll.question);
      
      // For poll slides with empty content, create content with QR code
      let htmlContent = slide.htmlContent;
      if (!slide.content || slide.content.trim() === '') {
        const content = `
# ${slide.title}

**${slide.poll.question}**

**Options:** ${slide.poll.options.join(' • ')}

{{AUTO_POLL_QR}}
        `.trim();
        htmlContent = `
<h1>${slide.title}</h1>
<h2>${slide.poll.question}</h2>
<p><strong>Options:</strong> ${slide.poll.options.join(' • ')}</p>
<!-- poll-qr -->
        `.trim();
        slide = { ...slide, content, htmlContent };
      }
      
      // Replace QR placeholder with actual QR code - get ngrok URL from service
      const ngrokUrl = this.ngrokService.getPublicUrl() || process.env.NGROK_URL;
      console.log('Using ngrok URL for QR:', ngrokUrl);
      const updatedHtmlContent = this.presentationService.replaceQRPlaceholder(htmlContent, poll.id, ngrokUrl);
      console.log('Original HTML length:', htmlContent.length, 'contains QR placeholder:', htmlContent.includes('<!-- poll-qr -->'));
      console.log('Updated HTML length:', updatedHtmlContent.length, 'contains img tag:', updatedHtmlContent.includes('<img'));
      slide = { ...slide, htmlContent: updatedHtmlContent };
      
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
    const state = this.presentationService.getCurrentState();
    return {
      slideIndex: state.slideIndex,
      totalSlides: state.totalSlides,
      currentSlide: state.currentSlide,
      css: state.css
    };
  }
}