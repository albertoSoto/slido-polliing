import { Injectable, OnModuleInit } from '@nestjs/common';
import * as ngrok from '@ngrok/ngrok';

@Injectable()
export class NgrokService implements OnModuleInit {
  private ngrokUrl: string | null = null;
  private ngrokListener: any = null;

  async onModuleInit() {
    await this.initializeNgrok();
  }

  private async initializeNgrok() {
    try {
      if (!process.env.NGROK_AUTHTOKEN) {
        console.log('ℹ️  No NGROK_AUTHTOKEN found in environment variables');
        console.log('📱 Add your ngrok token to .env file for public access');
        console.log('📱 Using local URLs only');
        return null;
      }

      console.log('🔗 Starting ngrok tunnel...');
      
      const listener = await ngrok.forward({ 
        addr: parseInt(process.env.PORT) || 3000, 
        authtoken_from_env: true 
      });

      this.ngrokListener = listener;
      const url = listener.url();
      this.ngrokUrl = url;
      
      // Set environment variable for other services to use
      process.env.NGROK_URL = url;
      
      console.log(`🌐 Public URL: ${url}`);
      console.log(`📱 Mobile voting: ${url}`);
      console.log(`⚙️  Admin panel: ${url}/admin`);
      console.log(`🎤 Presenter: ${url}/presenter`);
      
      return url;
    } catch (error) {
      console.warn('⚠️  Failed to start ngrok tunnel:', error.message);
      
      if (error.message.includes('authtoken') || error.message.includes('authentication')) {
        console.log('💡 Check your NGROK_AUTHTOKEN in the .env file');
        console.log('💡 Sign up at https://ngrok.com to get your auth token');
      }
      
      console.log('📱 Using local URLs only');
      return null;
    }
  }

  getPublicUrl(): string | null {
    return this.ngrokUrl;
  }

  async onModuleDestroy() {
    if (this.ngrokListener) {
      try {
        await this.ngrokListener.close();
      } catch (error) {
        console.warn('Error closing ngrok listener:', error.message);
      }
    }
  }
}