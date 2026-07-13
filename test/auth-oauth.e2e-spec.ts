import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { OAuthAuthService } from '../src/auth/oauth/oauth-auth.service';

describe('Auth OAuth (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
          },
        },
        {
          provide: OAuthAuthService,
          useValue: {
            signInWithGoogle: jest
              .fn()
              .mockRejectedValue(new Error('Invalid Google token')),
            signInWithApple: jest
              .fn()
              .mockRejectedValue(new Error('Invalid Apple token')),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/oauth/google rejects empty body', () => {
    return request(app.getHttpServer())
      .post('/auth/oauth/google')
      .send({})
      .expect(400);
  });

  it('POST /auth/oauth/apple rejects empty body', () => {
    return request(app.getHttpServer())
      .post('/auth/oauth/apple')
      .send({})
      .expect(400);
  });
});
