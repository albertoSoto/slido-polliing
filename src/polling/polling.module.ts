import { Module } from '@nestjs/common';
import { PollingController } from './polling.controller';
import { PollingService } from './polling.service';
import { PollingGateway } from './polling.gateway';

@Module({
  controllers: [PollingController],
  providers: [PollingService, PollingGateway],
  exports: [PollingService, PollingGateway],
})
export class PollingModule {}