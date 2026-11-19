import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { EventPublisher } from './event-publisher.service';
import {
  ORDER_EVENTS_QUEUE,
  ORDER_EVENTS_QUEUE_OPTIONS,
  RABBITMQ_CLIENT,
} from './messaging.constants';
import { OrderEventsController } from './order-events.controller';

/**
 * RabbitMQ cho BrewLite. Đặt RABBITMQ_URL (amqp://user:pass@host:5672) để bật;
 * để trống thì EventPublisher là no-op và API chạy như bình thường.
 * @Global để OrdersService / PaymentsService inject EventPublisher mà không cần import module.
 */
@Global()
@Module({
  controllers: [OrderEventsController],
  providers: [
    {
      provide: RABBITMQ_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('RABBITMQ_URL');
        if (!url) return null;
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [url],
            queue: ORDER_EVENTS_QUEUE,
            queueOptions: ORDER_EVENTS_QUEUE_OPTIONS,
            persistent: true,
          },
        });
      },
    },
    EventPublisher,
  ],
  exports: [EventPublisher],
})
export class MessagingModule {}
