import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthProvider } from '@prisma/client';
import { AuthService } from '../auth.service';
import { AppleTokenVerifierService } from './apple-token-verifier.service';
import { GoogleTokenVerifierService } from './google-token-verifier.service';
import { OAuthAuthService } from './oauth-auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('OAuthAuthService', () => {
  let service: OAuthAuthService;
  let prisma: {
    userAuthIdentity: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let authService: { issueTokensForUser: jest.Mock };
  let googleTokenVerifier: { verify: jest.Mock };
  let appleTokenVerifier: { verify: jest.Mock };

  beforeEach(async () => {
    prisma = {
      userAuthIdentity: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };
    authService = {
      issueTokensForUser: jest.fn().mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      }),
    };
    googleTokenVerifier = { verify: jest.fn() };
    appleTokenVerifier = { verify: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        OAuthAuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: authService },
        { provide: GoogleTokenVerifierService, useValue: googleTokenVerifier },
        { provide: AppleTokenVerifierService, useValue: appleTokenVerifier },
      ],
    }).compile();

    service = module.get(OAuthAuthService);
  });

  it('signs in an existing Google identity', async () => {
    googleTokenVerifier.verify.mockResolvedValue({
      provider: AuthProvider.GOOGLE,
      providerUserId: 'google-sub',
      email: 'user@example.com',
      emailVerified: true,
    });
    prisma.userAuthIdentity.findUnique.mockResolvedValue({
      user: {
        id: 'user-id',
        email: 'user@example.com',
        role: { name: 'user' },
      },
    });

    await expect(service.signInWithGoogle('token')).resolves.toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    expect(authService.issueTokensForUser).toHaveBeenCalledWith(
      'user-id',
      'user@example.com',
      'user',
    );
  });

  it('links a Google identity to an existing email account', async () => {
    googleTokenVerifier.verify.mockResolvedValue({
      provider: AuthProvider.GOOGLE,
      providerUserId: 'google-sub',
      email: 'user@example.com',
      emailVerified: true,
    });
    prisma.userAuthIdentity.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      emailVerified: false,
      role: { name: 'user' },
      authIdentities: [],
    });

    await service.signInWithGoogle('token');

    expect(prisma.userAuthIdentity.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        provider: AuthProvider.GOOGLE,
        providerUserId: 'google-sub',
        providerEmail: 'user@example.com',
      },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { emailVerified: true },
    });
  });

  it('creates a new OAuth user when no account exists', async () => {
    appleTokenVerifier.verify.mockResolvedValue({
      provider: AuthProvider.APPLE,
      providerUserId: 'apple-sub',
      email: 'new@example.com',
      emailVerified: true,
      firstName: null,
      lastName: null,
    });
    prisma.userAuthIdentity.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'new-user-id',
      email: 'new@example.com',
      role: { name: 'user' },
    });

    await service.signInWithApple('token', {
      firstName: 'Marie',
      lastName: 'Dupont',
    });

    expect(prisma.user.create).toHaveBeenCalled();
    expect(authService.issueTokensForUser).toHaveBeenCalledWith(
      'new-user-id',
      'new@example.com',
      'user',
    );
  });

  it('rejects Apple sign-in without email on first connection', async () => {
    appleTokenVerifier.verify.mockResolvedValue({
      provider: AuthProvider.APPLE,
      providerUserId: 'apple-sub',
      email: null,
      emailVerified: false,
    });
    prisma.userAuthIdentity.findUnique.mockResolvedValue(null);

    await expect(service.signInWithApple('token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws when the provider identity conflicts', async () => {
    googleTokenVerifier.verify.mockResolvedValue({
      provider: AuthProvider.GOOGLE,
      providerUserId: 'google-sub-2',
      email: 'user@example.com',
      emailVerified: true,
    });
    prisma.userAuthIdentity.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      emailVerified: true,
      role: { name: 'user' },
      authIdentities: [
        {
          provider: AuthProvider.GOOGLE,
          providerUserId: 'google-sub-1',
        },
      ],
    });

    await expect(service.signInWithGoogle('token')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
