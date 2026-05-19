import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const corsOrigins = [
    'http://localhost:3001',
    'http://localhost:3000',
    'https://tr-autoblog-frontend.vercel.app',
    ...(process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? []),
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        corsOrigins.includes(origin) ||
        /\.vercel\.app$/i.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: false,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  await app.listen(process.env.PORT ?? 3000);
  console.log('🚀 AutoBlog AI is running on http://localhost:3000');
  console.log('🌐 Frontend should run on http://localhost:3001');
}
bootstrap();
