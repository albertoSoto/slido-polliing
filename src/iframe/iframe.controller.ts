import { Controller, Get, Param, Query, Render, Req } from '@nestjs/common';
import { PollingService } from '../polling/polling.service';
import * as QRCode from 'qrcode';

@Controller('iframe')
export class IframeController {
  constructor(private readonly pollingService: PollingService) {}

  @Get('qr/:pollId?')
  @Render('iframe/qr')
  async getQRCode(@Param('pollId') pollId?: string, @Req() req?: any) {
    const actualPollId = pollId || this.pollingService.getCurrentPollId();
    const baseUrl = process.env.NGROK_URL || `http://localhost:3000`;
    const voteUrl = `${baseUrl}/vote/${actualPollId || ''}`;
    
    let qrCode = null;
    if (actualPollId) {
      try {
        qrCode = await QRCode.toDataURL(voteUrl);
      } catch (error) {
        console.error('QR Code generation failed:', error);
      }
    }
    
    return {
      qrCode,
      voteUrl,
      hasPoll: !!actualPollId,
    };
  }

  @Get('question')
  @Render('iframe/question')
  getQuestion(@Query('q') question = 'Sample Question', @Query('options') optionsParam = '') {
    const options = optionsParam ? optionsParam.split(',') : ['Option 1', 'Option 2', 'Option 3'];
    
    return {
      question,
      options: options.map((option, index) => ({
        letter: String.fromCharCode(65 + index),
        text: option.trim(),
      })),
    };
  }

  @Get('results/:pollId?')
  @Render('iframe/results')
  getResults(@Param('pollId') pollId?: string) {
    const actualPollId = pollId || this.pollingService.getCurrentPollId();
    const poll = actualPollId ? this.pollingService.getPoll(actualPollId) : null;
    
    return {
      poll,
      hasResults: !!poll,
      pollData: poll ? {
        labels: JSON.stringify(poll.options.map(opt => opt.text)),
        data: JSON.stringify(poll.options.map(opt => opt.votes)),
        colors: JSON.stringify([
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ]),
      } : null,
    };
  }
}