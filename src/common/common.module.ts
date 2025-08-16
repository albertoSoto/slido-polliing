import { Module } from '@nestjs/common';
import { NgrokService } from './services/ngrok.service';
import { MarpService } from './services/marp.service';

@Module({
  providers: [NgrokService, MarpService],
  exports: [NgrokService, MarpService],
})
export class CommonModule {}