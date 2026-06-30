import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PremiumService } from '../../billing/premium.service';
import { AuthUser } from '../decorators/current-user.decorator';

/**
 * Restreint l'accès d'une route aux utilisateurs premium.
 * À utiliser après `JwtAuthGuard` afin que `request.user` soit renseigné.
 */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private readonly premiumService: PremiumService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    const user = request.user;

    if (!user?.id || !(await this.premiumService.isPremium(user.id))) {
      throw new ForbiddenException('Premium subscription required');
    }

    return true;
  }
}
