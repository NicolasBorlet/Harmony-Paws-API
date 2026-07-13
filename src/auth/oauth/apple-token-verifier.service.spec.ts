import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AuthProvider } from '@prisma/client';
import appleSignin from 'apple-signin-auth';
import { AppleTokenVerifierService } from './apple-token-verifier.service';

jest.mock('apple-signin-auth', () => ({
  __esModule: true,
  default: {
    verifyIdToken: jest.fn(),
  },
}));

describe('AppleTokenVerifierService', () => {
  let service: AppleTokenVerifierService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AppleTokenVerifierService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => 'com.harmonypaws'),
          },
        },
      ],
    }).compile();

    service = module.get(AppleTokenVerifierService);
    jest.clearAllMocks();
  });

  it('returns a verified Apple profile', async () => {
    (appleSignin.verifyIdToken as jest.Mock).mockResolvedValue({
      sub: 'apple-sub',
      email: 'user@privaterelay.appleid.com',
      email_verified: true,
    });

    await expect(service.verify('valid-token')).resolves.toEqual({
      provider: AuthProvider.APPLE,
      providerUserId: 'apple-sub',
      email: 'user@privaterelay.appleid.com',
      emailVerified: true,
      firstName: null,
      lastName: null,
    });
  });

  it('rejects invalid Apple tokens', async () => {
    (appleSignin.verifyIdToken as jest.Mock).mockRejectedValue(
      new Error('invalid'),
    );

    await expect(service.verify('bad-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
