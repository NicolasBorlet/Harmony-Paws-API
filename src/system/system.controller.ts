import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { ApiStandardResponses } from '../common/swagger/decorators/api-common.decorator';
import { HealthCheckResponseDto } from '../common/swagger/dto/responses/common.response.dto';

@ApiTags('system')
@Controller()
export class SystemController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('healthz')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Endpoint de sonde pour Kubernetes / load balancer. Vérifie la connectivité PostgreSQL.',
  })
  @ApiOkResponse({
    description: 'Service opérationnel',
    type: HealthCheckResponseDto,
  })
  @ApiStandardResponses()
  async healthCheck() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
