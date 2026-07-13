import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth.service';
import { AuthTokensDto } from '../dto/auth.dto';
import { AppleTokenVerifierService } from './apple-token-verifier.service';
import { GoogleTokenVerifierService } from './google-token-verifier.service';
import { OAuthProfile } from './oauth-profile';

@Injectable()
export class OAuthAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly googleTokenVerifier: GoogleTokenVerifierService,
    private readonly appleTokenVerifier: AppleTokenVerifierService,
  ) {}

  async signInWithGoogle(idToken: string): Promise<AuthTokensDto> {
    const profile = await this.googleTokenVerifier.verify(idToken);
    return this.authenticateWithProvider(profile);
  }

  async signInWithApple(
    identityToken: string,
    names?: { firstName?: string; lastName?: string },
  ): Promise<AuthTokensDto> {
    const profile = await this.appleTokenVerifier.verify(identityToken);
    return this.authenticateWithProvider({
      ...profile,
      firstName: names?.firstName ?? profile.firstName,
      lastName: names?.lastName ?? profile.lastName,
    });
  }

  private async authenticateWithProvider(
    profile: OAuthProfile,
  ): Promise<AuthTokensDto> {
    const existingIdentity = await this.prisma.userAuthIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider: profile.provider,
          providerUserId: profile.providerUserId,
        },
      },
      include: { user: { include: { role: true } } },
    });

    if (existingIdentity) {
      return this.authService.issueTokensForUser(
        existingIdentity.user.id,
        existingIdentity.user.email,
        existingIdentity.user.role.name,
      );
    }

    if (profile.email && profile.emailVerified) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
        include: { role: true, authIdentities: true },
      });

      if (existingUser) {
        const conflictingIdentity = existingUser.authIdentities.find(
          (identity) =>
            identity.provider === profile.provider &&
            identity.providerUserId !== profile.providerUserId,
        );
        if (conflictingIdentity) {
          throw new ConflictException(
            'This email is already linked to another account for this provider',
          );
        }

        await this.prisma.userAuthIdentity.create({
          data: {
            userId: existingUser.id,
            provider: profile.provider,
            providerUserId: profile.providerUserId,
            providerEmail: profile.email,
          },
        });

        if (!existingUser.emailVerified) {
          await this.prisma.user.update({
            where: { id: existingUser.id },
            data: { emailVerified: true },
          });
        }

        return this.authService.issueTokensForUser(
          existingUser.id,
          existingUser.email,
          existingUser.role.name,
        );
      }
    }

    if (!profile.email) {
      throw new UnauthorizedException(
        'Apple did not provide an email. Sign in with Apple again and share your email.',
      );
    }

    const user = await this.prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email: profile.email!,
          emailVerified: profile.emailVerified,
          firstName: profile.firstName ?? undefined,
          lastName: profile.lastName ?? undefined,
          userStats: { create: {} },
          userPreferences: { create: {} },
          authIdentities: {
            create: {
              provider: profile.provider,
              providerUserId: profile.providerUserId,
              providerEmail: profile.email,
            },
          },
        },
        include: { role: true },
      });
    });

    return this.authService.issueTokensForUser(
      user.id,
      user.email,
      user.role.name,
    );
  }
}
