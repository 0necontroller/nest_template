import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      disconnect: jest.fn(),
    };
  });
});

describe('RedisService', () => {
  let service: RedisService;
  let configService: any;
  let mockRedisClient: any;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('redis://localhost:6379'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    configService = module.get(ConfigService);

    // Call onModuleInit to instantiate client mock
    service.onModuleInit();
    mockRedisClient = service.getClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize redis client using config service url', () => {
      expect(configService.get).toHaveBeenCalledWith('redis.url');
      expect(Redis).toHaveBeenCalledWith('redis://localhost:6379');
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect the redis client', () => {
      service.onModuleDestroy();
      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should query redis key value', async () => {
      mockRedisClient.get.mockResolvedValue('stored-value');
      const val = await service.get('my-key');
      expect(val).toBe('stored-value');
      expect(mockRedisClient.get).toHaveBeenCalledWith('my-key');
    });
  });

  describe('set', () => {
    it('should set key/value without TTL', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      await service.set('my-key', 'value');
      expect(mockRedisClient.set).toHaveBeenCalledWith('my-key', 'value');
    });

    it('should set key/value with TTL', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      await service.set('my-key', 'value', 3600);
      expect(mockRedisClient.set).toHaveBeenCalledWith('my-key', 'value', 'EX', 3600);
    });
  });

  describe('del', () => {
    it('should delete keys in redis', async () => {
      mockRedisClient.del.mockResolvedValue(1);
      await service.del('my-key');
      expect(mockRedisClient.del).toHaveBeenCalledWith('my-key');
    });
  });
});
