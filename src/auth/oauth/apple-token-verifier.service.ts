import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '@prisma/client';
import appleSignin from 'apple-signin-auth';
import { OAuthProfile } from './oauth-profile';

@Injectable()
export class AppleTokenVerifierService {
  constructor(private readonly config: ConfigService) {}

  async verify(identityToken: string): Promise<OAuthProfile> {
    const clientId = this.config.get<string>('APPLE_CLIENT_ID');
    if (!clientId) {
      throw new UnauthorizedException('Apple Sign-In is not configured');
    }

    try {
      const payload = await appleSignin.verifyIdToken(identityToken, {
        audience: clientId,
        ignoreExpiration: false,
      });

      if (!payload.sub) {
        throw new UnauthorizedException('Invalid Apple token');
      }

      return {
        provider: AuthProvider.APPLE,
        providerUserId: payload.sub,
        email: payload.email ?? null,
        emailVerified:
          payload.email_verified === true || payload.email_verified === 'true',
        firstName: null,
        lastName: null,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Apple token');
    }
  }
}
