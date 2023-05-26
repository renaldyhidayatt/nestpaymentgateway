import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Topup } from './topup.entity';
import { Repository } from 'typeorm';
import { TopupDto, TopupResponseDto } from './dto/topup';
import {
  IFindNewTopup,
  IFindNewTopupHistory,
  IFindParamsHistoryTopup,
  IFindParamsTopup,
  IFindTopupHistory,
  ITopupMail,
} from './interface/topup';
import { rupiahFormatter } from 'src/utils/rupiah';
import { dateFormat } from 'src/utils/date';
import { User } from 'src/users/user.entity';
import sgMail, { ClientResponse } from '@sendgrid/mail';
import { tempMailTopup } from 'src/templates/topup';
import { Saldo } from 'src/saldo/saldo.entity';
import { uniqueOrderNumber } from 'src/utils/uniqueNumber';
import { Transfer } from 'src/transfer/transfer.entity';

@Injectable()
export class TopupService {
  constructor(
    @InjectRepository(Transfer)
    private transferRepository: Repository<Transfer>,
    @InjectRepository(Saldo) private saldoRepository: Repository<Saldo>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Topup) private topupRepository: Repository<Topup>,
  ) {}

  async resultsTopup(): Promise<TopupResponseDto> {
    const findTopupAmount = await this.topupRepository
      .createQueryBuilder('saldo')
      .leftJoin('saldo.user', 'user')
      .select([
        'user.userId',
        'user.email',
        'user.noc_transfer',
        'SUM(topup.topupAmount) as total_topup_amount',
      ])
      .innerJoin('user.topup', 'topup')
      .groupBy('user.userId, user.email, user.noc_transfer')
      .orderBy('user.userId', 'ASC')
      .getRawMany();

    const findMergeTopupAmount = findTopupAmount.map(
      async (val: IFindParamsTopup): Promise<Array<IFindNewTopupHistory>> => {
        const findTopupAmountHistory: IFindTopupHistory[] =
          await this.topupRepository
            .createQueryBuilder('topup')
            .select([
              'topup.topupId',
              'topup.user.userId',
              'topup.topupNo',
              'topup.topupAmount',
              'topup.topupMethod',
              'topup.topupTime',
            ])
            .where('topup.user.userId = :userId', { userId: val.user_id })
            .groupBy(
              'topup.topupId, topup.userId, topup.topupNo, topup.topupAmount, topup.topupMethod, topup.topupTime',
            )
            .orderBy('topup.topup_time', 'DESC')
            .getRawMany();

        const findNewTopupAmountHistory = findTopupAmountHistory.map(
          (val: IFindParamsHistoryTopup): IFindNewTopupHistory => ({
            topup_id: val.topup_id,
            kode_topup: val.topup_no,
            nominal_topup: rupiahFormatter(val.topup_amount.toString()),
            metode_pembayaran: val.topup_method,
            tanggal_topup: dateFormat(val.topup_time).format('llll'),
          }),
        );
        return findNewTopupAmountHistory;
      },
    );

    const findNewTopupAmountUser = findTopupAmount.map(
      async (val: IFindParamsTopup, i: number): Promise<IFindNewTopup> => ({
        topup_history: {
          user_id: val.user_id,
          email: val.email,
          kode_transfer: val.noc_transfer,
          total_nominal_topup: rupiahFormatter(
            val.total_topup_amount.toString(),
          ),
          total_topup: await findMergeTopupAmount[i],
        },
      }),
    );

    const findStoreTopupAmountHistory: any[] = [];
    for (const i of findNewTopupAmountUser) {
      findStoreTopupAmountHistory.push(await i);
    }
    return new TopupResponseDto(
      200,
      'POST',
      'data already to use',
      findStoreTopupAmountHistory,
    );
  }

  async resultTopup(id: number): Promise<TopupResponseDto> {
    const findTopupAmount = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.topup', 'topup')
      .select([
        'user.userId',
        'user.email',
        'user.nocTransfer',
        'SUM(topup.topupAmount) as totalTopupAmount',
      ])
      .where('user.userId = :id', { id: id })
      .groupBy('user.userId, user.email, user.nocTransfer')
      .orderBy('user.userId', 'ASC')
      .getRawMany();

    const findUser = await this.userRepository
      .createQueryBuilder('user')
      .select('user.email')
      .where('user.userId = :id', { id: id })
      .getMany();

    if (findTopupAmount.length < 1 && findUser.length > 0) {
      return new TopupResponseDto(
        200,
        'POST',
        `${findUser[0].email} you never topup money`,
      );
    }

    const findMergeTopupAmount = findTopupAmount.map(
      async (val: IFindParamsTopup): Promise<Array<IFindNewTopupHistory>> => {
        const findTopupAmountHistory: IFindTopupHistory[] =
          await this.topupRepository
            .createQueryBuilder('topup')
            .select([
              'topup.topupId',
              'topup.user',
              'topup.topupNo',
              'topup.topupAmount',
              'topup.topupMethod',
              'topup.topupTime',
            ])
            .where('topup.user.userId = :userId', { userId: val.user_id })
            .groupBy(
              'topup.topupId, topup.user, topup.topupNo, topup.topupAmount, topup.topupMethod, topup.topupTime',
            )
            .orderBy('topup.topupTime', 'DESC')
            .getRawMany();

        const findNewTopupAmountHistory = findTopupAmountHistory.map(
          (val: IFindParamsHistoryTopup): IFindNewTopupHistory => ({
            topup_id: val.topup_id,
            kode_topup: val.topup_no,
            nominal_topup: rupiahFormatter(val.topup_amount.toString()),
            metode_pembayaran: val.topup_method,
            tanggal_topup: dateFormat(val.topup_time).format('llll'),
          }),
        );

        return findNewTopupAmountHistory;
      },
    );

    const findNewTopupAmountUser = findTopupAmount.map(
      async (val: IFindParamsTopup): Promise<IFindNewTopup> => {
        return {
          topup_history: {
            user_id: val.user_id,
            email: val.email,
            kode_transfer: val.noc_transfer,
            total_nominal_topup: rupiahFormatter(
              val.total_topup_amount.toString(),
            ),
            total_topup: await findMergeTopupAmount[0],
          },
        };
      },
    );

    return new TopupResponseDto(
      200,
      'POST',
      'data already to use',
      await findNewTopupAmountUser[0],
    );
  }

  async createTopup(req: TopupDto): Promise<TopupResponseDto> {
    if (req.topup_amount <= 49000) {
      return new TopupResponseDto(
        403,
        'POST',
        'payment method is not support, please try again',
      );
    }

    const findUser = await this.userRepository.find({
      where: { userId: req.user_id },
    });

    if (findUser.length < 1) {
      return new TopupResponseDto(
        400,
        'POST',
        'user id is not exist, topup balance failed',
      );
    }

    const saveTopup = this.topupRepository.create({
      user: findUser[0],
      topupNo: uniqueOrderNumber(),
      topupAmount: req.topup_amount,
      topupMethod: req.topup_method,
      topupTime: dateFormat(new Date()),
      createdAt: new Date(),
    });

    await this.topupRepository.save(saveTopup);

    if (Object.keys(saveTopup[0]).length < 1) {
      return new TopupResponseDto(
        408,
        'POST',
        'topup balance failed, server is busy',
      );
    }

    const { user_id, topup_amount, topup_method }: any = saveTopup[0];

    const checkSaldoUserId = await this.saldoRepository
      .createQueryBuilder()
      .select('saldo.user.userId')
      .where('saldo.user.userId = :user_id', { user_id })
      .getMany();

    if (checkSaldoUserId.length < 1) {
      const newSaldo = this.saldoRepository.create({
        user: { userId: user_id },
        totalBalance: topup_amount,
        createdAt: new Date(),
      });
      await this.saldoRepository.save(newSaldo);
    } else {
      const findTransferHistory = await this.transferRepository
        .createQueryBuilder('transfer')
        .select([
          'transfer.transferFrom',
          'SUM(transfer.transferAmount) AS transferAmount',
          'transfer.transferTime',
        ])
        .where('transfer.transferFrom = :userId', {
          userId: checkSaldoUserId[0].user.userId,
        })
        .groupBy('transfer.transferFrom, transfer.transferTime')
        .orderBy('transfer.transferTime', 'DESC')
        .limit(1)
        .getRawMany();

      if (findTransferHistory.length < 0) {
        const findBalanceHistory = await this.topupRepository
          .createQueryBuilder('topup')
          .select(
            'topup.user.userId as userId, SUM(topup.topupAmount) as topupAmount',
          )
          .where('topup.user.userId = :userId', {
            userId: checkSaldoUserId[0].user.userId,
          })
          .groupBy('topup.user.userId')
          .getRawOne();

        await this.saldoRepository
          .createQueryBuilder()
          .update()
          .set({
            totalBalance: findBalanceHistory.topupAmount,
            updatedAt: new Date(),
          })
          .where('user_id = :userId', { userId: findBalanceHistory.userId })
          .execute();
      } else {
        const findBalanceHistory = await this.topupRepository
          .createQueryBuilder('topup')
          .leftJoinAndSelect('topup.user', 'user')
          .select('user.userId')
          .addSelect('SUM(topup.topupAmount)', 'topupAmount')
          .addSelect('topup.topupTime')
          .where('user.userId = :userId', {
            userId: checkSaldoUserId[0].user.userId,
          })
          .groupBy('user.userId, topup.topupTime')
          .orderBy('topup.topupTime', 'DESC')
          .take(1)
          .getOne();

        const findSaldo = await this.saldoRepository
          .createQueryBuilder('saldo')
          .select([
            'saldo.user.userId',
            `SUM(saldo.totalBalance + ${findBalanceHistory.topupAmount}) AS totalBalance`,
          ])
          .where('saldo.user.userId = :userId', {
            userId: findBalanceHistory[0].user.userId,
          })
          .groupBy('saldo.user.userId')
          .getRawOne();

        await this.saldoRepository
          .createQueryBuilder()
          .update(Saldo)
          .set({
            totalBalance: findSaldo.total_balance,
            updatedAt: new Date(),
          })
          .where('user.userId = :userId', { userId: findSaldo.user_id })
          .execute();
      }
    }

    const template: ITopupMail = tempMailTopup(
      findUser[0].email,
      topup_method!,
      topup_amount!,
    );
    const sgResponse: [ClientResponse, any] = await sgMail.send(template);

    if (!sgResponse) {
      return new TopupResponseDto(
        500,
        'POST',
        'Internal server error, failed to sending email notification topup',
      );
    }

    return new TopupResponseDto(
      201,
      'POST',
      `topup balance successfully, please check your email ${findUser[0].email}`,
    );
  }

  async updateTopup(id: number, req: TopupDto): Promise<TopupResponseDto> {
    const { user_id, topup_no, topup_amount, topup_method }: TopupDto = req;

    if (typeof topup_amount === 'undefined' || topup_amount <= 49000) {
      return new TopupResponseDto(
        403,
        'POST',
        'minimum topup balance Rp 50.000',
      );
    }

    const user = await this.userRepository.findOne({
      where: { userId: user_id },
    });
    const topup = await this.topupRepository.findOne({
      where: { topupId: id },
    });

    if (!user || !topup) {
      return new TopupResponseDto(
        404,
        'POST',
        'user id or topup id is not exist, update data topup failed',
      );
    }

    topup.user = user;
    topup.topupNo = topup_no;
    topup.topupAmount = topup_amount;
    topup.topupMethod = topup_method;

    try {
      await this.topupRepository.save(topup);
    } catch (error) {
      return new TopupResponseDto(
        408,
        'POST',
        'update data topup failed, server is busy',
      );
    }

    return new TopupResponseDto(200, 'POST', 'update data topup successfully');
  }

  async deleteTopup(id: number): Promise<TopupResponseDto> {
    const checkTopup = await this.topupRepository.findOne({
      where: { topupId: id },
    });

    if (!checkTopup) {
      return new TopupResponseDto(
        404,
        'POST',
        'Topup is not exist, delete data topup failed',
      );
    }

    try {
      await this.topupRepository.delete(checkTopup.topupId);
      return new TopupResponseDto(
        200,
        'POST',
        'Delete data topup successfully',
      );
    } catch (error) {
      return new TopupResponseDto(
        408,
        'POST',
        'Delete data topup failed, server is busy',
      );
    }
  }
}
