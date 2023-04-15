import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { WithdrawModule } from './withdraw/withdraw.module';
import { TopupModule } from './topup/topup.module';
import { TransferModule } from './transfer/transfer.module';
import { SaldoModule } from './saldo/saldo.module';

@Module({
  imports: [AdminModule, UsersModule, WithdrawModule, TopupModule, TransferModule, SaldoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
