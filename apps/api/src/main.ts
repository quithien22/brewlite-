//main
import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import {
  ORDER_EVENTS_QUEUE,
  ORDER_EVENTS_QUEUE_OPTIONS,
} from './messaging/messaging.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (process.env.FRONTEND_URL ?? 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim()),
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Ghi log hoạt động ra stdout (Render Logs). Chỉ ghi method, đường dẫn, mã trạng thái, thời gian;
  // không ghi header hay body nên không lộ token / mật khẩu.
  const httpLogger = new Logger('HTTP');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      httpLogger.log(
        `${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${Date.now() - start}ms`,
      );
    });
    next();
  });

  // Validate toàn bộ dữ liệu đầu vào (whitelist, từ chối trường lạ)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  // RabbitMQ: nhận sự kiện đơn hàng. Chỉ bật khi có RABBITMQ_URL.
  const rabbitUrl = process.env.RABBITMQ_URL;
  if (rabbitUrl) {
    const mqLogger = new Logger('RabbitMQ');
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitUrl],
        queue: ORDER_EVENTS_QUEUE,
        queueOptions: ORDER_EVENTS_QUEUE_OPTIONS,
        noAck: false,
        prefetchCount: 10,
      },
    });
    // Cố ý KHÔNG await: nếu RabbitMQ chưa sẵn sàng thì API HTTP vẫn khởi động bình thường,
    // consumer tự kết nối khi RabbitMQ lên.
    app
      .startAllMicroservices()
      .then(() => mqLogger.log(`Consumer đã kết nối, đang nghe queue ${ORDER_EVENTS_QUEUE}`))
      .catch((e) =>
        mqLogger.error(
          `Không khởi động được consumer: ${e instanceof Error ? e.message : String(e)}`,
        ),
      );
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`BrewLite API đang chạy tại http://localhost:${port}`);
}

bootstrap();
