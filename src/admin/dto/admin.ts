import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsString, Length } from 'class-validator';

export class AdminDto {
  @ApiProperty({ required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @IsString()
  @Length(6, 20)
  password: string;

  @ApiProperty({ required: true })
  @IsBoolean()
  active: boolean;

  @ApiProperty({ required: true })
  @IsString()
  role: string;
}
