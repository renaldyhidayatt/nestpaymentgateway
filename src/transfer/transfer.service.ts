import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transfer } from './transfer.entity';
import { Repository } from 'typeorm';
import { TransferResponseDto } from './dto/transferResponse';
import {
  IFindNewParamsTransferTo,
  IFindNewTransferFrom,
  IFindNewTransferTo,
  IFindParamsTransferTo,
  IFindparamsTransferFrom,
  ITransferMail,
} from './interface/transfer';
import { rupiahFormatter } from 'src/utils/rupiah';
import { dateFormat } from 'src/utils/date';
import { User } from 'src/users/user.entity';
import { TransferDTO } from './dto/transfer';
import { Saldo } from 'src/saldo/saldo.entity';
import { tempMailTransfer } from 'src/templates/transfer';
import sgMail, { ClientResponse } from '@sendgrid/mail';

@Injectable()
export class TransferService {
  constructor(
    @InjectRepository(Saldo) private saldoRepository: Repository<Saldo>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Transfer)
    private transferRepository: Repository<Transfer>,
  ) {}

  async resultsTransfer(): Promise<TransferResponseDto> {
    const findTransferSaldoFrom = await this.transferRepository
      .createQueryBuilder('transfer')
      .select([
        'users.userId',
        'users.email',
        'users.nocTransfer',
        'transfer.transferFrom',
        'transfer.transferTo',
        'SUM(transfer.transferAmount) as totalTransferAmount',
      ])
      .getMany();

    if (findTransferSaldoFrom.length < 1) {
      return new TransferResponseDto(400, 'POST', 'data is not exitst');
    }

    const findTransferSaldoTo = findTransferSaldoFrom.map(
      async (val: any): Promise<Array<IFindNewTransferTo>> => {
        const findSaldoTo = await this.transferRepository
          .createQueryBuilder('transfer')
          .leftJoinAndSelect('transfer.transferTo', 'user')
          .select([
            'user.userId',
            'transfer.transferId',
            'user.email',
            'user.nocTransfer',
            'transfer.transferAmount',
            'transfer.transferTime',
          ])
          .where('transfer.transferFrom = :transferFrom', {
            transferFrom: val.transfer_from,
          })
          .andWhere('transfer.transferTo = :transferTo', {
            transferTo: val.transfer_to,
          })
          .groupBy(
            'user.userId, transfer.transferId, user.email, user.nocTransfer, transfer.transferAmount, transfer.transferTime',
          )
          .orderBy('transfer.transferTime', 'DESC')
          .getRawMany();

        const newfindSaldoTo = findSaldoTo.map(
          (val: IFindNewParamsTransferTo): IFindNewTransferTo => ({
            transfer_id: val.transfer_id,
            email: val.email,
            kode_transfer: val.noc_transfer,
            nominal_transfer: rupiahFormatter(val.transfer_amount.toString()),
            tanggal_transfer: dateFormat(val.transfer_time).format('llll'),
          }),
        );

        return newfindSaldoTo;
      },
    );

    const newTransferSaldo = findTransferSaldoFrom.map(
      async (val: any, i: number): Promise<IFindNewTransferFrom> => ({
        transfer_history: {
          user_id: val.user_id,
          email: val.email,
          kode_transfer: val.noc_transfer,
          total_nominal_transfer: rupiahFormatter(
            val.total_transfer_amount.toString(),
          ),
          total_transfer: await findTransferSaldoTo[i],
        },
      }),
    );

    const transferSaldo: any = [];

    for (const i of newTransferSaldo) {
      transferSaldo.push(await i);
    }

    return new TransferResponseDto(
      200,
      'POST',
      'data already to use',
      await transferSaldo,
    );
  }

  async resultTransfer(id: number): Promise<TransferResponseDto> {
    const findTransferSaldoFrom = await this.transferRepository
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.transferFrom', 'user')
      .select([
        'user.userId',
        'user.email',
        'user.nocTransfer',
        'SUM(transfer.transferAmount) AS total_transfer_amount',
        'transfer.transferFrom',
        'transfer.transferTo',
      ])
      .where('user.userId = :userId', { userId: id })
      .groupBy(
        'user.userId, user.email, user.nocTransfer, transfer.transferFrom, transfer.transferTo',
      )
      .orderBy('user.userId', 'ASC')
      .getRawMany();

    const checkUserId = await this.userRepository.findOne({
      select: ['email'],
      where: {
        userId: id,
      },
    });

    if (findTransferSaldoFrom.length < 1 && checkUserId !== null) {
      return new TransferResponseDto(
        200,
        'POST',
        `${checkUserId.email} you never transfer money to other people`,
      );
    }

    const findTransferSaldoTo = findTransferSaldoFrom.map(
      async (
        val: IFindParamsTransferTo,
      ): Promise<Array<IFindNewTransferTo>> => {
        const findSaldoTo = await this.transferRepository
          .createQueryBuilder('transfer')
          .leftJoinAndSelect('transfer.transferTo', 'user')
          .select([
            'transfer.transferTo',
            'transfer.transferId',
            'user.email',
            'user.nocTransfer',
            'transfer.transferAmount',
            'transfer.transferTime',
          ])
          .where('transfer.transferTo = :toUserId', {
            toUserId: val.transfer_to,
          })
          .andWhere('transfer.transferFrom = :fromUserId', {
            fromUserId: val.transfer_from,
          })
          .groupBy(
            'transfer.transferTo, transfer.transferId, user.email, user.nocTransfer, transfer.transferAmount, transfer.transferTime',
          )
          .orderBy('transfer.transferTime', 'DESC')
          .getRawMany();

        const newfindSaldoTo = findSaldoTo.map(
          (val: IFindNewParamsTransferTo): IFindNewTransferTo => ({
            transfer_id: val.transfer_id,
            email: val.email,
            kode_transfer: val.noc_transfer,
            nominal_transfer: rupiahFormatter(val.transfer_amount.toString()),
            tanggal_transfer: dateFormat(val.transfer_time).format('llll'),
          }),
        );

        return newfindSaldoTo;
      },
    );
    const newTransferSaldo = findTransferSaldoFrom.map(
      async (val: IFindparamsTransferFrom): Promise<IFindNewTransferFrom> => ({
        transfer_history: {
          user_id: val.user_id,
          email: val.email,
          kode_transfer: val.noc_transfer,
          total_nominal_transfer: rupiahFormatter(
            val.total_transfer_amount.toString(),
          ),
          total_transfer: await findTransferSaldoTo[0],
        },
      }),
    );

    return new TransferResponseDto(
      200,
      'POST',
      'data already to use',
      await newTransferSaldo[0],
    );
  }

  async createTransfer(req: TransferDTO): Promise<TransferResponseDto> {
    const { transfer_from, transfer_to, transfer_amount }: TransferDTO = req;

    const checkUserIdFrom = await this.userRepository.find({
      select: ['userId', 'email'],
      where: {
        nocTransfer: transfer_from,
      },
    });

    const checkUserIdTo = await this.userRepository.find({
      select: ['userId', 'email'],
      where: {
        nocTransfer: transfer_to,
      },
    });

    if (!checkUserIdFrom[0] || !checkUserIdTo[0]) {
      return new TransferResponseDto(
        408,
        'POST',
        'user id is not exist, transfer balance failed',
      );
    }

    const transfer = new Transfer();
    transfer.transferFrom = checkUserIdFrom[0];
    transfer.transferTo = checkUserIdTo[0];
    transfer.transferAmount = transfer_amount;
    transfer.transferTime = dateFormat(new Date()).toDate();
    transfer.createdAt = new Date();

    const saveTransfer = await this.transferRepository.save(transfer);

    if (Object.keys(saveTransfer).length < 1) {
      return new TransferResponseDto(
        408,
        'POST',
        'transfer balance failed, server is busy',
      );
    }

    const checkSaldoFrom = await this.saldoRepository.findOne({
      where: { user: checkUserIdFrom[0] },
      select: ['totalBalance'],
    });

    if (checkSaldoFrom == null || checkSaldoFrom.totalBalance == undefined) {
      return new TransferResponseDto(
        404,
        'POST',
        'No saldo record found for the specified user',
      );
    } else if (checkSaldoFrom.totalBalance <= 49000) {
      return new TransferResponseDto(
        403,
        'POST',
        `${
          checkUserIdFrom[0].email
        } your balance is insufficient ${rupiahFormatter(
          checkSaldoFrom[0].total_balance.toString(),
        )}`,
      );
    }

    const findSaldoFrom = await this.saldoRepository
      .createQueryBuilder()
      .select(
        `SUM(total_balance - ${saveTransfer.transferAmount}) as total_balance`,
      )
      .where(`user_id = ${checkUserIdFrom[0].userId}`)
      .getRawMany();

    const findSaldoTo = await this.saldoRepository
      .createQueryBuilder()
      .select(
        `SUM(total_balance + ${saveTransfer[0].transferAmount}) as total_balance`,
      )
      .where(`user_id = ${checkUserIdTo[0].userId}`)
      .getRawMany();

    if (!findSaldoFrom[0] || !findSaldoTo[0]) {
      return new TransferResponseDto(
        408,
        'POST',
        'saldo id is not exist, transfer balance failed',
      );
    }

    const updateSaldoUserFrom = await this.saldoRepository.update(
      { user: checkUserIdFrom[0] },
      {
        totalBalance: findSaldoFrom[0].total_balance,
        updatedAt: new Date(),
      },
    );

    const updateSaldoUserTo = await this.saldoRepository.update(
      { user: checkUserIdTo[0] },
      {
        totalBalance: findSaldoTo[0].total_balance,
        updatedAt: new Date(),
      },
    );

    if (updateSaldoUserFrom == null || updateSaldoUserTo == null) {
      return new TransferResponseDto(
        408,
        'POST',
        'transfer balance failed, server is busy',
      );
    }

    const template: ITransferMail = tempMailTransfer(
      checkUserIdFrom[0].email,
      checkUserIdTo[0].email,
      saveTransfer[0].transfer_amount ?? 0,
    );
    const sgResponse: [ClientResponse, any] = await sgMail.send(template);

    if (!sgResponse) {
      return new TransferResponseDto(
        500,
        'POST',
        'Internal server error, failed to sending email notification transfer',
      );
    }

    return new TransferResponseDto(
      201,
      'POST',
      `transfer balance successfully, please check your email ${checkUserIdFrom[0].email}`,
    );
  }

  async updateTransfer(
    id: number,
    req: TransferDTO,
  ): Promise<TransferResponseDto> {
    const { transfer_from, transfer_to, transfer_amount }: TransferDTO = req;

    if (!transfer_amount || transfer_amount <= 49000) {
      return new TransferResponseDto(
        403,
        'POST',
        'minimum transfer balance is Rp 50.000',
      );
    }

    const checkUserId = await this.userRepository
      .createQueryBuilder('user')
      .where('user.transferFrom.userId = :transfer_from', { transfer_from })
      .andWhere('user.transferTo.userId = :transfer_to', { transfer_to })
      .getMany();

    if (checkUserId.length !== 2) {
      return new TransferResponseDto(
        404,
        'POST',
        'user id is not exist, update data transfer failed',
      );
    }

    const updateTransfer = await this.transferRepository.update(id, {
      transferFrom: { userId: transfer_from },
      transferTo: { userId: transfer_to },
      transferAmount: transfer_amount,
      updatedAt: new Date(),
    });

    if (updateTransfer.affected < 1) {
      return new TransferResponseDto(
        408,
        'POST',
        'update data transfer failed, server is busy',
      );
    }

    return new TransferResponseDto(
      200,
      'POST',
      'update data transfer successfully',
    );
  }

  async deleteTransfer(id: number): Promise<TransferResponseDto> {
    const transfer = await this.transferRepository.findOne({
      where: {
        transferId: id,
      },
    });

    if (!transfer) {
      return new TransferResponseDto(
        404,
        'POST',
        'transfer id is not exist, delete data transfer failed',
      );
    }

    await this.transferRepository.remove(transfer);

    const deleteTransfer = await this.transferRepository.delete({
      transferId: id,
    });

    if (deleteTransfer.affected === 0) {
      return new TransferResponseDto(
        408,
        'POST',
        'delete data transfer failed, server is busy',
      );
    }

    return new TransferResponseDto(
      200,
      'POST',
      'delete data transfer successfully',
    );
  }
}
