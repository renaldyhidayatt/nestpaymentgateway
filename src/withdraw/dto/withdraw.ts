import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class WithdrawResponseDto {
  status: number;
  method: string;
  message: string;
  data?: any;

  constructor(status: number, method: string, message: string, data?: any) {
    this.status = status;
    this.method = method;
    this.message = message;
    this.data = data;
  }
}

export class CreateWithdrawDto {
  @ApiProperty({ required: true })
  @IsNumber()
  @Min(0)
  @IsPositive()
  withdraw_amount: number;

  @ApiProperty({ required: true })
  @IsNumber()
  @Min(1)
  user_id: number;
}
