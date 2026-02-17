import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const port = 3000;
  const server = await app.listen(port);
  
  // Aumentar timeout para 5 minutos (300 segundos)
  server.setTimeout(300000);
  
  console.log(`API rodando em: http://localhost:${port}`);
}
bootstrap();