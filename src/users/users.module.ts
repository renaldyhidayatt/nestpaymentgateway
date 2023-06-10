import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { AccessTokenStrategy } from './strategies/accessToken.strategy';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';
import { RoleGuard } from './role.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule],
  providers: [
    UsersService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    {
      provide: RoleGuard,
      useValue: new RoleGuard(['admin', 'moderator', 'user']),
    },
  ],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
