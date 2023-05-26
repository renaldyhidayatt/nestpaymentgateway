export class SaldoResponseDto {
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

export class SaldoDto {
  user_id: number;
  total_balance: number;

  constructor(user_id: number, total_balance: number) {
    this.user_id = user_id;
    this.total_balance = total_balance;
  }
}
