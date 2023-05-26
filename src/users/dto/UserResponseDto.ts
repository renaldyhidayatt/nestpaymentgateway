export class UserResponseDTO {
  status: number;
  method: string;
  message: string;
  token?: any; // Optional token property

  constructor(status: number, method: string, message: string, token?: any) {
    this.status = status;
    this.method = method;
    this.message = message;
    this.token = token;
  }
}
