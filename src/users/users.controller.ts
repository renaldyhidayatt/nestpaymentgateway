import { Request } from 'express';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { UserResponseDTO } from './dto/UserResponseDto';
import { LoginDto } from './dto/UserDto';
import { ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedUser {
  email: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  @Get('activate')
  async activeAccount(
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<UserResponseDTO> {
    const email = req.user.email;

    return this.usersService.activateAccount(email);
  }

  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  @Post('forgot')
  async forgot(
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<UserResponseDTO> {
    const email = req.user.email;

    return this.usersService.forgot(email);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<UserResponseDTO> {
    return this.usersService.login(dto);
  }

  @Post('register')
  async register(@Body() dto: LoginDto): Promise<UserResponseDTO> {
    return this.usersService.register(dto);
  }

  @ApiBearerAuth()
  @Post('resend')
  @UseGuards(AccessTokenGuard)
  async resend(
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<UserResponseDTO> {
    const email = req.user.email;

    return this.usersService.resend(email);
  }

  @ApiBearerAuth()
  @Post('reset')
  @UseGuards(AccessTokenGuard)
  async reset(
    @Req() req: Request & { user: AuthenticatedUser },
    @Body('password') password: string,
  ): Promise<UserResponseDTO> {
    const email = req.user.email;

    return this.usersService.reset(email, password);
  }
}
