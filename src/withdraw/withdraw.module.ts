import { Module } from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import { WithdrawController } from './withdraw.controller';
import { User } from 'src/users/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Withdraw } from './withdraw.entity';
import { Saldo } from 'src/saldo/saldo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Withdraw, Saldo])],
  providers: [WithdrawService],
  controllers: [WithdrawController],
})
export class WithdrawModule {}
