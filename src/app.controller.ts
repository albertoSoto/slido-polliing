import { Controller, Get, Render } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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