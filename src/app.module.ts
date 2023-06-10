import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { WithdrawModule } from './withdraw/withdraw.module';
import { TopupModule } from './topup/topup.module';
import { TransferModule } from './transfer/transfer.module';
import { SaldoModule } from './saldo/saldo.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { Saldo } from './saldo/saldo.entity';
import { Topup } from './topup/topup.entity';
import { Transfer } from './transfer/transfer.entity';
import { Withdraw } from './withdraw/withdraw.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [User, Saldo, Topup, Transfer, Withdraw],
      synchronize: true,
    }),

    AdminModule,
    UsersModule,
    WithdrawModule,
    TopupModule,
    TransferModule,
    SaldoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
