import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Saldo } from './saldo.entity';
import { Repository } from 'typeorm';
import { SaldoDto, SaldoResponseDto } from './dto/saldo';
import { IFindNewBalance } from './interface/saldo';
import { rupiahFormatter } from 'src/utils/rupiah';
import { User } from 'src/users/user.entity';

@Injectable()
export class SaldoService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Saldo) private saldoRepository: Repository<Saldo>,
  ) {}

  async resultsSaldo(): Promise<SaldoResponseDto> {
    const findBalance = await this.saldoRepository.find({
      relations: ['user'],
      select: ['user', 'totalBalance', 'createdAt'],
    });

    const newBalanceUsers = findBalance.map(
      (val: Saldo): IFindNewBalance => ({
        saldo_history: {
          user_id: val.user.userId,
          email: val.user.email,
          kode_transfer: val.user.nocTransfer,
          jumlah_uang: rupiahFormatter(val.totalBalance.toString()),
        },
      }),
    );

    return new SaldoResponseDto(
      200,
      'GET',
      'data already to use',
      newBalanceUsers,
    );
  }
  async resultSaldo(id: number): Promise<SaldoResponseDto> {
    const findBalance = await this.userRepository.find({
      where: { userId: id },
      select: ['userId', 'email', 'nocTransfer'],
      relations: ['saldo'],
      join: {
        alias: 'user',
        leftJoinAndSelect: {
          saldo: 'user.saldo',
        },
      },
    });

    if (findBalance.length < 1) {
      return new SaldoResponseDto(200, 'GET', 'user id is not exist');
    }

    const newBalanceUsers = findBalance.map((val: any): IFindNewBalance => {
      return {
        saldo_history: {
          user_id: val.saldo_user_id,
          email: val.email,
          kode_transfer: val.noc_transfer,
          jumlah_uang: rupiahFormatter(val.total_balance.toString()),
        },
      };
    });

    return new SaldoResponseDto(
      200,
      'GET',
      'data already to use',
      newBalanceUsers[0],
    );
  }

  async createSaldo(req: SaldoDto): Promise<SaldoResponseDto> {
    if (req.total_balance <= 49000) {
      return new SaldoResponseDto(403, 'POST', 'mininum saldo Rp 50.000');
    }

    const user = await this.userRepository.findOne({
      where: { userId: req.user_id },
    });
    const saldo = await this.saldoRepository.findOne({
      where: { user },
    });

    if (!user) {
      return new SaldoResponseDto(
        404,
        'POST',
        'user id is not exist, add saldo failed',
      );
    }

    if (saldo) {
      return new SaldoResponseDto(
        409,
        'POST',
        'saldo user id already exist, add saldo failed',
      );
    }

    const newSaldo = new Saldo();
    newSaldo.user = user;
    newSaldo.totalBalance = req.total_balance;
    newSaldo.createdAt = new Date();

    const saveSaldo = await this.saldoRepository.save(newSaldo);

    if (Object.keys(saveSaldo[0]).length < 1) {
      return new SaldoResponseDto(
        408,
        'POST',
        'add saldo failed, server is busy',
      );
    }

    return new SaldoResponseDto(200, 'POST', 'add saldo successfully');
  }

  async updateSaldo(id: number, req: SaldoDto): Promise<SaldoResponseDto> {
    const { user_id, total_balance }: SaldoDto = req;

    const user = await this.userRepository.findOne({
      where: { userId: user_id },
    });

    if (!user) {
      return new SaldoResponseDto(404, 'POST', 'User not found');
    }

    const saldo = await this.saldoRepository.findOne({
      where: { saldoId: id },
      relations: ['user'],
    });

    if (!saldo) {
      return new SaldoResponseDto(404, 'POST', 'Saldo not found');
    }

    saldo.user = user;
    saldo.totalBalance = total_balance;

    try {
      await this.saldoRepository.save(saldo);

      return new SaldoResponseDto(200, 'POST', 'Update saldo successfully');
    } catch (error) {
      return new SaldoResponseDto(500, 'POST', 'Update saldo failed');
    }
  }

  async deleteSaldo(id: number): Promise<SaldoResponseDto> {
    const user = await this.userRepository.findOne({ where: { userId: id } });
    if (!user) {
      return new SaldoResponseDto(404, 'POST', 'User not found.');
    }

    const saldo = await this.saldoRepository.findOne({ where: { user } });
    if (!saldo) {
      return new SaldoResponseDto(
        404,
        'POST',
        'Saldo not found for the specified user.',
      );
    }

    try {
      await this.saldoRepository.remove(saldo);

      return new SaldoResponseDto(
        200,
        'POST',
        'Saldo data successfully deleted.',
      );
    } catch (error) {
      return new SaldoResponseDto(
        500,
        'POST',
        'Server error, please try again later.',
      );
    }
  }
}
