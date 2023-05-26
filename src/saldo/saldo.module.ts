import { Module } from '@nestjs/common';
import { SaldoService } from './saldo.service';
import { SaldoController } from './saldo.controller';

@Module({
  providers: [SaldoService],
  controllers: [SaldoController]
})
export class SaldoModule {}
