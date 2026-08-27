import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { helmetConfig } from './common/helment';
import { AppConfig } from './common/config/env.config.validate';
import { apiReference } from '@scalar/nestjs-api-reference';
import { SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { swaggerConfig } from './common/config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const configService = app.get<ConfigService<AppConfig>>(ConfigService);
  const PORT = configService.get<number>('port');

  const allowedOriginsString =
    configService.get<string>('allowedOrigins') ?? '';
  const origins = allowedOriginsString
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0)
    .map((o) => {
      if (!o.startsWith('http://') && !o.startsWith('https://')) {
        return new RegExp(`^https?://${o.replace(/\./g, '\\.')}(:\\d+)?$`);
      }
      return o;
    });

  app.enableCors({
    origin: origins.length > 0 ? origins : true,
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.use(helmet(helmetConfig));
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  app.use(
    '/api/v1/docs',
    apiReference({
      spec: {
        content: document,
      },
    }),
  );

  await app.listen(PORT ?? 8001);
}

bootstrap().catch((err) => {
  console.error('Application failed to start: ', err);
  process.exit(1);
});
