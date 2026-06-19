import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  app.enableShutdownHooks();
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN')?.split(',') ?? '*',
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new SnakeCaseInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Harmony Paws API')
    .setDescription('REST API for Harmony Paws mobile app')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
}
bootstrap();
