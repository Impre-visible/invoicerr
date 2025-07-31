import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    credentials: true,
    origin: ['http://localhost:5173', process.env.APP_URL, ...(process.env.CORS_ORIGINS?.split(',').map(o => o.trim()).filter(val => !!val) || [])],
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.use((_req, res, next) => {
    res.header('Access-Control-Expose-Headers', 'WWW-Authenticate');
    next();
  })
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
