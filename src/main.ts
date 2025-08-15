import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import 'dotenv/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure Handlebars view engine
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 NestJS Server running on port ${port}`);
  console.log(`📊 Admin panel: http://localhost:${port}/admin`);
  console.log(`📱 Voting page: http://localhost:${port}`);
  console.log(`🎤 Presenter: http://localhost:${port}/presenter`);
  console.log(`📝 Slides (run 'pnpm run slides'): http://localhost:3001`);
}

bootstrap();