import { Module } from '@nestjs/common';
import { PollingModule } from './polling/polling.module';
import { PresentationModule } from './presentation/presentation.module';
import { IframeModule } from './iframe/iframe.module';
import { CommonModule } from './common/common.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    CommonModule,
    PollingModule,
    PresentationModule,
    IframeModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}