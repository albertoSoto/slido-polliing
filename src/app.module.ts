import { Module } from '@nestjs/common';
import { PollingModule } from './polling/polling.module';
import { PresentationModule } from './presentation/presentation.module';
import { IframeModule } from './iframe/iframe.module';
import { AppController } from './app.controller';
import { NgrokService } from './common/services/ngrok.service';

@Module({
  imports: [
    PollingModule,
    PresentationModule,
    IframeModule,
  ],
  controllers: [AppController],
  providers: [NgrokService],
})
export class AppModule {}