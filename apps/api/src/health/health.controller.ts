import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  /** GET /health — 200 khi ứng dụng và database sống, 503 khi mất kết nối database (NFR-17). */
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      this.logger.error(
        `Health check thất bại: ${e instanceof Error ? e.message : String(e)}`,
      );
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
      });
    }
    return {
      status: 'ok',
      database: 'up',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
