import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigurationService } from './config/configuration.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { tenantName } = app.get(ConfigurationService);
  app.enableCors({
    origin: new RegExp(`^https://${tenantName}(-[^.]+)?\\.sharepoint\\.com$`),
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SharePoint Search Assistant')
    .setDescription('AI-assisted search for SharePoint Online content')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
void bootstrap();
