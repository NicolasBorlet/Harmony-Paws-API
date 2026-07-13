import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AuthProvider } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { GoogleTokenVerifierService } from './google-token-verifier.service';

jest.mock('google-auth-library');

describe('GoogleTokenVerifierService', () => {
  let service: GoogleTokenVerifierService;
  let verifyIdToken: jest.Mock;

  beforeEach(async () => {
    verifyIdToken = jest.fn();
    (OAuth2Client as jest.Mock).mockImplementation(() => ({
      verifyIdToken,
    }));

    const module = await Test.createTestingModule({
      providers: [
        GoogleTokenVerifierService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GOOGLE_WEB_CLIENT_ID') return 'web-client-id';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(GoogleTokenVerifierService);
  });

  it('returns a verified Google profile', async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub',
        email: 'user@example.com',
        email_verified: true,
        given_name: 'Marie',
        family_name: 'Dupont',
      }),
    });

    await expect(service.verify('valid-token')).resolves.toEqual({
      provider: AuthProvider.GOOGLE,
      providerUserId: 'google-sub',
      email: 'user@example.com',
      emailVerified: true,
      firstName: 'Marie',
      lastName: 'Dupont',
    });
  });

  it('rejects unverified Google emails', async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub',
        email: 'user@example.com',
        email_verified: false,
      }),
    });

    await expect(service.verify('valid-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
