import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  findAll() {
    return this.prisma.user.findMany({
      include: { accounts: true },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { accounts: true },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
    // Invalidate role cache in Redis immediately
    await this.redisService.del(`user-role:${id}`);
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.prisma.user.delete({
      where: { id },
    });
    // Invalidate role cache in Redis immediately
    await this.redisService.del(`user-role:${id}`);
    return deleted;
  }
}
