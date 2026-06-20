import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case-response.interceptor';
import { setupSwagger } from './common/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  app.enableShutdownHooks();

  // CORS must be configured explicitly. We never fall back to a wildcard
  // origin while credentials are enabled — that combination is unsafe.
  const corsOrigin = config
    .get<string>('CORS_ORIGIN')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (!corsOrigin || corsOrigin.length === 0) {
    throw new Error(
      'CORS_ORIGIN must be set to a comma-separated list of allowed origins',
    );
  }
  // A wildcard origin combined with credentials is unsafe and rejected outright.
  if (corsOrigin.includes('*')) {
    throw new Error(
      'CORS_ORIGIN cannot be "*" while credentials are enabled — list explicit origins',
    );
  }
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.use(helmet());
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new SnakeCaseInterceptor());

  setupSwagger(app);

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
}
bootstrap();
