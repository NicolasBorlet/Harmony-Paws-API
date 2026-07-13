import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AuthProvider } from '@prisma/client';
import { OAuthProfile } from './oauth-profile';

@Injectable()
export class GoogleTokenVerifierService {
  private readonly client = new OAuth2Client();

  constructor(private readonly config: ConfigService) {}

  async verify(idToken: string): Promise<OAuthProfile> {
    const audience = [
      this.config.get<string>('GOOGLE_WEB_CLIENT_ID'),
      this.config.get<string>('GOOGLE_IOS_CLIENT_ID'),
      this.config.get<string>('GOOGLE_ANDROID_CLIENT_ID'),
    ].filter((value): value is string => !!value);

    if (audience.length === 0) {
      throw new UnauthorizedException('Google OAuth is not configured');
    }

    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience });
      const payload = ticket.getPayload();

      if (!payload?.sub) {
        throw new UnauthorizedException('Invalid Google token');
      }

      if (!payload.email || payload.email_verified !== true) {
        throw new UnauthorizedException('Google account email is not verified');
      }

      return {
        provider: AuthProvider.GOOGLE,
        providerUserId: payload.sub,
        email: payload.email,
        emailVerified: true,
        firstName: payload.given_name ?? null,
        lastName: payload.family_name ?? null,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Google token');
    }
  }
}
