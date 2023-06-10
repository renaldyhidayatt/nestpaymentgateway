import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  readonly transfer_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  readonly transfer_from?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  readonly transfer_to?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly transfer_amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  readonly transfer_time?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  readonly created_at?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  readonly updated_at?: Date;
}
