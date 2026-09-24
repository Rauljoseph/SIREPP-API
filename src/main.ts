import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors();

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SIREPP API')
    .setDescription('Sistema Integrado de Registro y Reunificación de Placas Patente')
    .setVersion('1.0')
    .addTag('Encargos', 'Registro y gestión de encargos de placas')
    .addTag('Hallazgos', 'Registro de placas encontradas')
    .addTag('Reunificación', 'Conciliación y entrega de placas')
    .addTag('Consulta operativa', 'Consulta de estado de placas en vía pública')
    .addTag('Trazabilidad', 'Lecturas de pórticos')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`SIREPP corriendo en http://localhost:${port}`);
  console.log(`Swagger en http://localhost:${port}/api/docs`);
}
bootstrap();