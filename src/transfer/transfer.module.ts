import { Module } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { TransferController } from './transfer.controller';
import { Saldo } from 'src/saldo/saldo.entity';
import { User } from 'src/users/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transfer } from './transfer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Saldo, User, Transfer])],
  providers: [TransferService],
  controllers: [TransferController],
})
export class TransferModule {}
