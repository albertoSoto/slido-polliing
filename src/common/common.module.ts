import { Module } from '@nestjs/common';
import { NgrokService } from './services/ngrok.service';

@Module({
  providers: [NgrokService],
  exports: [NgrokService],
})
export class CommonModule {}