import { NestFactory } from '@nestjs/core';
import { AdminModule } from './admin.module';

const PORT = process.env.ADMIN_PORT || 2001
async function bootstrap() {
  const app = await NestFactory.create(AdminModule);
  await app.listen(PORT);
}
bootstrap();
