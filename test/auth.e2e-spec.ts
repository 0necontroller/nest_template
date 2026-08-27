process.env.NODE_ENV = 'development';
process.env.DATABASE_URL = 'file:test.db';
process.env.REFRESH_JWT_SECRET = 'test-refresh-secret';
process.env.REFRESH_JWT_EXPIRES_IN = '604800';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '3600';
process.env.GOOGLE_CLINET_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:8001/auth/google/callback';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { hash } from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let passwordHash: string;

  const mockUser = {
    id: 'user-id-123',
    email: 'e2e@example.com',
    firstName: 'E2E',
    lastName: 'User',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession = {
    id: 'session-id-123',
    userId: 'user-id-123',
    sessionToken: 'refresh-token-123',
    expires: new Date(Date.now() + 604800000), // 7 days
    ipAddress: null,
    userAgent: null,
  };

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeAll(async () => {
    passwordHash = await hash('password123');
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/auth/signup (POST)', () => {
    it('should register a new user and set HTTPOnly cookie', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        accounts: [],
      });
      mockPrismaService.session.create.mockResolvedValue(mockSession);
      mockPrismaService.session.update.mockResolvedValue({});

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'e2e@example.com',
          password: 'password123',
          firstName: 'E2E',
          lastName: 'User',
        })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.email).toBe('e2e@example.com');
      expect(response.body.data).not.toHaveProperty('accounts');
      expect(response.body.meta).toHaveProperty('timestamp');
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(
        cookies.some((cookie: string) => cookie.includes('refreshToken')),
      ).toBe(true);
      expect(
        cookies.some((cookie: string) => cookie.includes('accessToken')),
      ).toBe(true);
    });

    it('should throw validation error if request payload is invalid', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'invalid-email',
          password: '123', // less than 6 chars
        })
        .expect(400);
    });
  });

  describe('/api/v1/auth/login (POST)', () => {
    it('should authenticate user and set cookie', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue({
        id: 'account-id-123',
        userId: 'user-id-123',
        provider: 'local',
        providerAccountId: 'e2e@example.com',
        passwordHash,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.session.create.mockResolvedValue(mockSession);
      mockPrismaService.session.update.mockResolvedValue({});

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'e2e@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('User logged in successfully');
      expect(response.body.data.email).toBe('e2e@example.com');
      expect(response.body.data).not.toHaveProperty('accounts');
      expect(response.body.meta).toHaveProperty('timestamp');
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(
        cookies.some((cookie: string) => cookie.includes('refreshToken')),
      ).toBe(true);
      expect(
        cookies.some((cookie: string) => cookie.includes('accessToken')),
      ).toBe(true);
    });

    it('should return 401 on invalid credentials', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });
});
