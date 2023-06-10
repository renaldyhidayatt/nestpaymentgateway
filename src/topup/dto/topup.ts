import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class TopupResponseDto {
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

export class TopupDto {
  @IsOptional()
  topup_no?: any;

  @IsNumber()
  @IsPositive()
  topup_amount: number;

  @IsNumber()
  user_id: number;

  @IsString()
  topup_method: string;

  constructor(
    user_id: number,
    topup_amount: number,
    topup_method: string,
    topup_no?: any,
  ) {
    this.topup_amount = topup_amount;
    this.user_id = user_id;
    this.topup_method = topup_method;
    this.topup_no = topup_no;
  }
}
