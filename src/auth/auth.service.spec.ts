import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService.login', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn(), get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('rejects OAuth-only accounts without a password hash', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'oauth@example.com',
      passwordHash: null,
      role: { name: 'user' },
    });

    await expect(
      service.login({ email: 'oauth@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
