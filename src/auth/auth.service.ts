import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokensDto, LoginDto, RegisterDto } from './dto/auth.dto';

const BCRYPT_ROUNDS = 12;

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

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        userStats: { create: {} },
        userPreferences: { create: {} },
      },
      include: { role: true },
    });

    return this.issueTokensForUser(user.id, user.email, user.role.name);
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Google or Apple sign-in',
      );
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokensForUser(user.id, user.email, user.role.name);
  }

  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    try {
      const payload = this.jwt.verify<{ sub: string; email: string }>(
        refreshToken,
        {
          secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
          algorithms: ['HS256'],
        },
      );

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });
      // The stored refresh token is hashed; compare against the presented one.
      const matches =
        !!user?.refreshToken &&
        (await bcrypt.compare(refreshToken, user.refreshToken));
      if (!user || !matches) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.issueTokensForUser(user.id, user.email, user.role.name);
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

  async issueTokensForUser(
    userId: string,
    email: string,
    role: string,
  ): Promise<AuthTokensDto> {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: '15m',
      algorithm: 'HS256',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
      algorithm: 'HS256',
    });

    // Store only a hash of the refresh token so a database leak does not expose
    // usable long-lived credentials.
    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: refreshTokenHash },
    });

    return { accessToken, refreshToken };
  }
}
