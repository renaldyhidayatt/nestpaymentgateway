import { Module } from '@nestjs/common';
import { TopupService } from './topup.service';
import { TopupController } from './topup.controller';
import { Transfer } from 'src/transfer/transfer.entity';
import { User } from 'src/users/user.entity';
import { Saldo } from 'src/saldo/saldo.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topup } from './topup.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transfer, User, Saldo, Topup])],
  providers: [TopupService],
  controllers: [TopupController],
})
export class TopupModule {}
