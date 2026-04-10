import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  // Create app with rawBody option enabled for webhook signature verification
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body buffering for webhook verification
  });
  const configService = app.get(ConfigService);

  // Configure Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Only applies to webhook endpoints
  app.use('/api/v1/payment/webhook', bodyParser.raw({ type: 'application/json', limit: '10mb' }));

  // Configure body parser limits for larger payloads (like file uploads)
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  // MANUAL CORS MIDDLEWARE - This works reliably
  app.use((req, res, next) => {
    // Set CORS headers for every response
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin,X-Requested-With,Content-Type,Accept,Authorization,x-api-key,X-Api-Key,x-project-id,X-Project-ID,x-app-id,X-App-ID,x-organization-id,X-Organization-ID,x-company-id,X-Company-ID"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400");

    // Handle preflight OPTIONS requests
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    next();
  });

  // API prefix
  const apiPrefix = configService.get("API_PREFIX") || "api/v1";
  app.setGlobalPrefix(apiPrefix);

    // Swagger documentation
    const config = new DocumentBuilder()
    .setTitle('Team@Once API')
    .setDescription('Comprehensive Life Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' })
    .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);

  const port = configService.get('PORT') || 3003;
  await app.listen(port);

  console.log(`🚀 Team@Once Backend is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
  console.log(`🌐 API Endpoint: http://localhost:${port}/${apiPrefix}`);
  console.log(`⚡ WebSocket Server: ws://localhost:${port}`);
}

bootstrap();