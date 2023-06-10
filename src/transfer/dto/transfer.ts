import { IsDate, IsNumber, IsOptional, IsPositive } from 'class-validator';

interface ITransfer {
  readonly transfer_id?: number;
  readonly transfer_from?: number;
  readonly transfer_to?: number;
  readonly transfer_amount?: number;
  readonly transfer_time?: any;
  readonly created_at?: Date;
  readonly updated_at?: Date;
}

export class TransferDTO implements ITransfer {
  @IsOptional()
  @IsNumber()
  readonly transfer_id?: number;

  @IsOptional()
  @IsNumber()
  readonly transfer_from?: number;

  @IsOptional()
  @IsNumber()
  readonly transfer_to?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly transfer_amount?: number;

  @IsOptional()
  readonly transfer_time?: any;

  @IsOptional()
  @IsDate()
  readonly created_at?: Date;

  @IsOptional()
  @IsDate()
  readonly updated_at?: Date;
}
