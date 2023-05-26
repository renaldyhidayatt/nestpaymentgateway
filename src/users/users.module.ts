import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { AccessTokenStrategy } from './strategies/accessToken.strategy';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';
import { RoleGuard } from './role.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    UsersService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    RoleGuard,
  ],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
