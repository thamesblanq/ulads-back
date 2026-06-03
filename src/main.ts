import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/intercerptors/logging.intercerptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // Import Swagger tools

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ==============================================================================
  // SWAGGER CONFIGURATION
  // ==============================================================================
  const config = new DocumentBuilder()
    .setTitle('ULADS API Portal')
    .setDescription('The core API documentation engine for the ULADS platform')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token here',
        in: 'header',
      },
      'JWT-auth', // This is the security name used to link routes to this auth scheme
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Expose the documentation interactive UI at http://localhost:3000/api
  SwaggerModule.setup('api', app, document);
  // ==============================================================================
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
