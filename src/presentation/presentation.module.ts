import { Module } from '@nestjs/common';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';
import { PollingModule } from '../polling/polling.module';

@Module({
  imports: [PollingModule],
  controllers: [PresentationController],
  providers: [PresentationService],
  exports: [PresentationService],
})
export class PresentationModule {}