import { Module } from '@nestjs/common';
import { SaldoService } from './saldo.service';
import { SaldoController } from './saldo.controller';
import { Saldo } from './saldo.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Saldo])],
  providers: [SaldoService],
  controllers: [SaldoController],
})
export class SaldoModule {}
