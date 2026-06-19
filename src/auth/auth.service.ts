import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokensDto, LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokensDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        userStats: { create: {} },
      },
    });

    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id, user.email);
  }

  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    try {
      const payload = this.jwt.verify<{ sub: string; email: string }>(
        refreshToken,
        { secret: this.config.getOrThrow('JWT_REFRESH_SECRET') },
      );

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.issueTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  private async issueTokens(
    userId: string,
    email: string,
  ): Promise<AuthTokensDto> {
    const payload = { sub: userId, email };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: '15m',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  }
}
