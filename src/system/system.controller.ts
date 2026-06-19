import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('system')
@Controller()
export class SystemController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('healthz')
  @SkipThrottle()
  async healthCheck() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
