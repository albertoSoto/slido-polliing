import { Module } from '@nestjs/common';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';
import { PollingModule } from '../polling/polling.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PollingModule, CommonModule],
  controllers: [PresentationController],
  providers: [PresentationService],
  exports: [PresentationService],
})
export class PresentationModule {}