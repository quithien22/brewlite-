import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /** Health check / "Hello" của Task 1 */
  @Get()
  hello() {
    return { message: 'Hello BrewLite', status: 'ok' };
  }
}
