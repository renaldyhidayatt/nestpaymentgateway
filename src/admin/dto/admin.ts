import { IsBoolean, IsEmail, IsString, Length } from 'class-validator';

export class AdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @IsBoolean()
  active: boolean;

  @IsString()
  role: string;
}
