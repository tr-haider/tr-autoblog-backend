import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express from 'express';

let cachedApp: express.Application;

async function createApp(): Promise<express.Application> {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  const corsOrigins = [
    'http://localhost:3001',
    'http://localhost:3000',
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
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  cachedApp = expressApp;
  return expressApp;
}

export default async function handler(
  req: express.Request,
  res: express.Response,
): Promise<void> {
  const app = await createApp();
  app(req, res);
}

