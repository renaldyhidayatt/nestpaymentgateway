import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Withdraw } from './withdraw.entity';
import { Repository } from 'typeorm';
import {
  IFinNewdWithdrawAmountHistory,
  IFindNewWithdrawAmount,
  IFindParamsWithdrawAmount,
  IFindParamsWithdrawAmountHistory,
  IWithdrawMail,
} from './interface/withdraw';
import { rupiahFormatter } from 'src/utils/rupiah';
import { dateFormat } from 'src/utils/date';
import { CreateWithdrawDto, WithdrawResponseDto } from './dto/withdraw';
import { User } from 'src/users/user.entity';
import { Saldo } from 'src/saldo/saldo.entity';
import { tempMailWithdraw } from 'src/templates/withdraw';
import sgMail, { ClientResponse } from '@sendgrid/mail';

@Injectable()
export class WithdrawService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Saldo) private saldoRepository: Repository<Saldo>,
    @InjectRepository(Withdraw)
    private withdrawRepository: Repository<Withdraw>,
  ) {}
  async resultsWithdraw(): Promise<WithdrawResponseDto> {
    const findWithdrawAmount = await this.withdrawRepository
      .createQueryBuilder('withdraw')
      .leftJoinAndSelect('withdraw.user', 'user')
      .select([
        'user.userId',
        'user.email',
        'user.nocTransfer',
        'SUM(withdraw.withdrawAmount) as totalWithdrawAmount',
      ])
      .groupBy('user.userId, user.email, user.nocTransfer')
      .orderBy('user.userId', 'ASC')
      .getRawMany();

    if (findWithdrawAmount.length < 1) {
      return new WithdrawResponseDto(200, 'POST', 'data is not exitst');
    }

    const findWithdrawAmountHistory = findWithdrawAmount.map(
      async (
        val: IFindParamsWithdrawAmountHistory,
      ): Promise<Array<IFinNewdWithdrawAmountHistory>> => {
        const findSaldoTo = await this.withdrawRepository
          .createQueryBuilder('withdraw')
          .innerJoin('withdraw.user', 'user')
          .select([
            'user.userId',
            'user.email',
            'user.nocTransfer',
            'withdraw.withdrawId',
            'withdraw.withdrawAmount',
            'withdraw.withdrawTime',
          ])
          .where('user.userId = :userId', { userId: val.user_id })
          .groupBy(
            'user.userId, user.email, user.nocTransfer, withdraw.withdrawId, withdraw.withdrawAmount, withdraw.withdrawTime',
          )
          .orderBy('withdraw.withdrawTime', 'DESC')
          .getMany();

        const newFindWithdrawAmountHistory = findSaldoTo.map(
          (val: any): IFinNewdWithdrawAmountHistory => ({
            transfer_id: val.withdraw_id,
            email: val.email,
            kode_transfer: val.noc_transfer,
            nominal_withdraw: rupiahFormatter(val.withdraw_amount.toString()),
            tanggal_withdraw: dateFormat(val.withdraw_time).format('llll'),
          }),
        );

        return newFindWithdrawAmountHistory;
      },
    );

    const newWithdrawAmount = findWithdrawAmount.map(
      async (
        val: IFindParamsWithdrawAmount,
        i: number,
      ): Promise<IFindNewWithdrawAmount> => ({
        withdraw_history: {
          user_id: val.user_id,
          email: val.email,
          kode_transfer: val.noc_transfer,
          total_nominal_withdraw: rupiahFormatter(
            val.total_withdraw_amount.toString(),
          ),
          total_withdraw: await findWithdrawAmountHistory[i],
        },
      }),
    );
    const withdrawAmount: any[] = [];

    for (const i of newWithdrawAmount) {
      withdrawAmount.push(await i);
    }

    return new WithdrawResponseDto(200, 'POST', 'data already to use');
  }

  async resultWithdraw(id: number): Promise<WithdrawResponseDto> {
    const findWithdrawAmount = await this.withdrawRepository
      .createQueryBuilder('withdraw')
      .leftJoin('withdraw.user', 'user')
      .select([
        'user.userId',
        'user.email',
        'user.noc_transfer',
        'SUM(withdraw.withdraw_amount) AS total_withdraw_amount',
      ])
      .where('user.userId = :id', { id: id })
      .groupBy('user.userId, user.email, user.noc_transfer')
      .orderBy('user.userId', 'ASC')
      .getRawMany();

    const checkUserId = await this.withdrawRepository
      .createQueryBuilder('user')
      .select('user.email')
      .where('user.userId = :id', { id: id })
      .getOne();

    if (findWithdrawAmount.length < 1 && checkUserId[0] == null) {
      return new WithdrawResponseDto(
        200,
        'POST',
        `${checkUserId[0].email} you never withdraw money`,
      );
    }

    const findWithdrawAmountHistory = findWithdrawAmount.map(
      async (
        val: IFindParamsWithdrawAmountHistory,
      ): Promise<Array<IFinNewdWithdrawAmountHistory>> => {
        const findSaldoTo = await this.withdrawRepository
          .createQueryBuilder('withdraw')
          .innerJoinAndSelect('withdraw.user', 'user')
          .select([
            'user.user_id',
            'user.email',
            'user.noc_transfer',
            'withdraw.withdraw_id',
            'withdraw.withdraw_amount',
            'withdraw.withdraw_time',
          ])
          .where('user.user_id = :id', { id: val.user_id })
          .groupBy(
            'user.user_id, user.email, user.noc_transfer, withdraw.withdraw_id, withdraw.withdraw_amount, withdraw.withdraw_time',
          )
          .orderBy('withdraw.withdraw_time', 'DESC')
          .getMany();

        const newFindWithdrawAmountHistory = findSaldoTo.map(
          (val: any): IFinNewdWithdrawAmountHistory => ({
            transfer_id: val.withdraw_id,
            email: val.email,
            kode_transfer: val.noc_transfer,
            nominal_withdraw: rupiahFormatter(val.withdraw_amount.toString()),
            tanggal_withdraw: dateFormat(val.withdraw_time).format('llll'),
          }),
        );

        return newFindWithdrawAmountHistory;
      },
    );

    const newWithdrawAmount = findWithdrawAmount.map(
      async (
        val: IFindParamsWithdrawAmount,
      ): Promise<IFindNewWithdrawAmount> => ({
        withdraw_history: {
          user_id: val.user_id,
          email: val.email,
          kode_transfer: val.noc_transfer,
          total_nominal_withdraw: rupiahFormatter(
            val.total_withdraw_amount.toString(),
          ),
          total_withdraw: await findWithdrawAmountHistory[0],
        },
      }),
    );
    return new WithdrawResponseDto(
      200,
      'POST',
      'data already to use',
      await newWithdrawAmount[0],
    );
  }

  async createWithdraw(req: CreateWithdrawDto): Promise<WithdrawResponseDto> {
    if (req.withdraw_amount <= 49000) {
      return new WithdrawResponseDto(
        403,
        'POST',
        'mininum withdraw balance Rp 50.000',
      );
    }

    const findUser = await this.userRepository.find({
      select: ['userId', 'email'],
      where: {
        userId: req.user_id,
      },
    });

    if (findUser.length) {
      return new WithdrawResponseDto(
        404,
        'POST',
        'user id is not exist, withdraw failed',
      );
    }

    const checkSaldo = await this.saldoRepository.findOne({
      where: {
        user: {
          userId: req.user_id,
        },
      },
    });

    if (
      checkSaldo &&
      checkSaldo.totalBalance &&
      checkSaldo.totalBalance <= 49000
    ) {
      return new WithdrawResponseDto(
        403,
        'POST',
        `${findUser[0].email} your balance is insufficient ${rupiahFormatter(
          checkSaldo.totalBalance.toString(),
        )}`,
      );
    }

    const withdraw = new Withdraw();
    withdraw.user = findUser[0];
    withdraw.withdrawAmount = req.withdraw_amount;
    withdraw.withdrawTime = new Date();
    withdraw.createdAt = new Date();

    const savedWithdraw = await this.withdrawRepository.save(withdraw);

    if (!savedWithdraw) {
      return new WithdrawResponseDto(
        408,
        'POST',
        'withdraw failed, server is busy',
      );
    }

    const lastWithdrawAmount = await this.withdrawRepository.findOne({
      where: { user: { userId: savedWithdraw.user.userId } },
      order: { withdrawTime: 'DESC' },
      select: ['withdrawAmount', 'withdrawTime'],
    });

    const subtractBalance = await this.saldoRepository
      .createQueryBuilder('saldo')
      .select(
        `SUM(totalBalance - ${lastWithdrawAmount.withdrawAmount})`,
        'total_balance',
      )
      .where({ user_id: savedWithdraw.user.userId })
      .execute();

    await this.saldoRepository.update(
      { user: { userId: savedWithdraw.user.userId } },
      {
        totalBalance: subtractBalance[0].totalBalance,
        updatedAt: new Date(),
      },
    );

    const withdrawAmount = lastWithdrawAmount[0]?.withdrawAmount;
    const totalBalance = subtractBalance[0]?.total_balance;

    const template: IWithdrawMail = tempMailWithdraw(
      findUser[0].email,
      withdrawAmount !== undefined ? withdrawAmount : 0,
      totalBalance !== undefined ? totalBalance : 0,
    );

    const sgResponse: [ClientResponse, any] = await sgMail.send(template);

    if (!sgResponse) {
      return new WithdrawResponseDto(
        500,
        'POST',
        'Internal server error, failed to sending email notification withdraw',
      );
    }

    return new WithdrawResponseDto(
      200,
      'POST',
      `withdraw successfully, please check your email ${findUser[0].email}`,
    );
  }

  async updateWithdraw(
    id: number,
    req: CreateWithdrawDto,
  ): Promise<WithdrawResponseDto> {
    if ((req.withdraw_amount || 0) <= 49000) {
      return new WithdrawResponseDto(
        403,
        'POST',
        'minimum withdraw balance Rp 50.000',
      );
    }
    const checkUserId = await this.userRepository.findOne({
      where: {
        userId: req.user_id,
      },
    });

    const checkWithDrawId = await this.withdrawRepository.findOne({
      where: {
        withdrawId: req.user_id,
      },
    });

    if (checkUserId == null || checkWithDrawId == null) {
      return new WithdrawResponseDto(
        404,
        'POST',
        'user id or withdraw id is not exist, update data withdraw failed',
      );
    }

    checkWithDrawId.user = checkUserId;
    checkWithDrawId.withdrawAmount = req.withdraw_amount;
    checkWithDrawId.updatedAt = new Date();

    await this.withdrawRepository.save(checkWithDrawId);

    if (checkWithDrawId == null) {
      return new WithdrawResponseDto(
        408,
        'POST',
        'update data withdraw failed, server is busy',
      );
    }

    return new WithdrawResponseDto(
      200,
      'POST',
      'update data withdraw successfully',
    );
  }

  async deleteWithdraw(id: number): Promise<WithdrawResponseDto> {
    const withdraw = await this.withdrawRepository.findOne({
      where: {
        withdrawId: id,
      },
    });

    if (!withdraw) {
      return new WithdrawResponseDto(
        404,
        'POST',
        'Withdraw id does not exist, failed to delete withdraw data',
      );
    }

    try {
      await this.withdrawRepository.delete(id);
    } catch (error) {
      return new WithdrawResponseDto(
        408,
        'POST',
        'Failed to delete withdraw data, server is busy',
      );
    }

    return new WithdrawResponseDto(
      200,
      'POST',
      'Withdraw data deleted successfully',
    );
  }
}
