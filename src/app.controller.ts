import { Controller, Get, Render, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

@Controller()
export class AppController {
  @Get()
  @Render('app/vote')
  getVotingPage() {
    return { title: 'Vote' };
  }

  @Get('admin')
  @Render('app/admin')
  getAdminPage() {
    return { title: 'Admin' };
  }

  @Get('presenter')
  @Render('app/presenter')
  getPresenterPage() {
    const availablePresentations = this.getAvailablePresentations();
    return { 
      title: 'Presenter',
      presentations: availablePresentations
    };
  }

  @Get('vote/:pollId')
  @Render('app/vote')
  getVotePage() {
    return { title: 'Vote' };
  }

  @Get('api/qr/:pollId')
  async getQRCode(@Param('pollId') pollId: string, @Res() res: Response) {
    try {
      // Generate voting URL - use localhost for now, will be replaced with ngrok URL
      const voteUrl = `http://localhost:3000/vote/${pollId}`;
      
      // Generate QR code as PNG buffer
      const qrBuffer = await QRCode.toBuffer(voteUrl, {
        type: 'png',
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.set({
        'Content-Type': 'image/png',
        'Content-Length': qrBuffer.length,
        'Cache-Control': 'no-cache'
      });
      
      res.send(qrBuffer);
    } catch (error) {
      console.error('QR generation failed:', error);
      res.status(500).send('QR generation failed');
    }
  }

  @Get('api/poll/start')
  async startPoll(@Query('question') question: string, @Query('options') options: string) {
    // This endpoint will be called when a Marp slide with poll questions is displayed
    // It should start a new poll with the provided question and options
    try {
      const optionsArray = options ? options.split(',').map(opt => opt.trim()) : [];
      
      // Here you would integrate with your polling service to start a new poll
      // For now, return success response
      return {
        success: true,
        pollId: Date.now().toString(), // Generate a simple poll ID
        question,
        options: optionsArray
      };
    } catch (error) {
      console.error('Poll start failed:', error);
      return { success: false, error: 'Failed to start poll' };
    }
  }


  private getAvailablePresentations() {
    try {
      const pollsDir = path.join(process.cwd(), 'polls');
      const files = fs.readdirSync(pollsDir);
      
      return files
        .filter(file => file.endsWith('.md'))
        .map(file => {
          const name = file.replace('.md', '');
          const filePath = path.join(pollsDir, file);
          const stats = fs.statSync(filePath);
          
          // Try to extract title from file
          let title = name;
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const titleMatch = content.match(/^#\s+(.+)$/m);
            if (titleMatch) {
              title = titleMatch[1].replace(/[🎉📊💻📱]/g, '').trim();
            }
          } catch (e) {
            // Use filename if can't read
          }
          
          return {
            name,
            title,
            lastModified: stats.mtime.toISOString().split('T')[0]
          };
        })
        .sort((a, b) => b.lastModified.localeCompare(a.lastModified));
    } catch (error) {
      console.error('Error reading presentations:', error);
      return [];
    }
  }
}