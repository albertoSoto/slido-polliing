import { Controller, Post, Get, Param, Body, BadRequestException, NotFoundException } from '@nestjs/common';
import { PollingService } from './polling.service';
import { PollingGateway } from './polling.gateway';
import { Poll } from '../common/interfaces/poll.interface';
import * as QRCode from 'qrcode';

@Controller('api')
export class PollingController {
  constructor(
    private readonly pollingService: PollingService,
    private readonly pollingGateway: PollingGateway,
  ) {}

  @Post('poll')
  createPoll(@Body() body: { question: string; options: string[] }) {
    const { question, options } = body;
    
    if (!question || !options || options.length === 0) {
      throw new BadRequestException('Question and options are required');
    }

    const poll = this.pollingService.createPoll(question, options);
    
    // Emit to all connected clients
    this.pollingGateway.emitPollStarted(poll);
    
    return {
      pollId: poll.id,
      qrUrl: `http://localhost:3000/vote/${poll.id}`,
      poll,
    };
  }

  @Get('poll/:id')
  getPoll(@Param('id') id: string) {
    const poll = this.pollingService.getPoll(id);
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }
    return poll;
  }

  @Post('vote/:pollId/:optionId')
  vote(@Param('pollId') pollId: string, @Param('optionId') optionId: string) {
    const poll = this.pollingService.vote(pollId, parseInt(optionId));
    
    if (!poll) {
      throw new BadRequestException('Poll not found or inactive');
    }
    
    // Emit vote update to all clients
    this.pollingGateway.emitVoteUpdate(poll);
    
    return { success: true, poll };
  }

  @Post('poll/:id/stop')
  stopPoll(@Param('id') id: string) {
    const poll = this.pollingService.stopPoll(id);
    
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }
    
    // Emit poll stopped to all clients
    this.pollingGateway.emitPollStopped(poll);
    
    return { success: true };
  }

  @Get('qr/:pollId')
  async getQRCode(@Param('pollId') pollId: string) {
    try {
      const baseUrl = process.env.NGROK_URL || `http://localhost:3000`;
      const voteUrl = `${baseUrl}/vote/${pollId}`;
      const qrCode = await QRCode.toDataURL(voteUrl);
      return { qrCode, voteUrl };
    } catch (error) {
      throw new BadRequestException('Failed to generate QR code');
    }
  }
}