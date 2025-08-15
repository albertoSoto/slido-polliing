import { Module } from '@nestjs/common';
import { IframeController } from './iframe.controller';
import { PollingModule } from '../polling/polling.module';

@Module({
  imports: [PollingModule],
  controllers: [IframeController],
})
export class IframeModule {}