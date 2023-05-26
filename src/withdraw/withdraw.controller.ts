import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import { CreateWithdrawDto, WithdrawResponseDto } from './dto/withdraw';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { RoleGuard } from 'src/users/role.guard';

@Controller('withdraw')
export class WithdrawController {
  constructor(private readonly withdrawService: WithdrawService) {}

  @UseGuards(new AccessTokenGuard())
  @Get()
  async resultsWithdraw(): Promise<WithdrawResponseDto> {
    return await this.withdrawService.resultsWithdraw();
  }

  @UseGuards(new AccessTokenGuard())
  @Get(':id')
  async resultWithdraw(@Param('id') id: number): Promise<WithdrawResponseDto> {
    return await this.withdrawService.resultWithdraw(id);
  }

  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Post()
  async createWithdraw(
    @Body() req: CreateWithdrawDto,
  ): Promise<WithdrawResponseDto> {
    return await this.withdrawService.createWithdraw(req);
  }

  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Post(':id')
  async updateWithdraw(
    @Param('id') id: number,
    @Body() req: CreateWithdrawDto,
  ): Promise<WithdrawResponseDto> {
    return await this.withdrawService.updateWithdraw(id, req);
  }

  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Delete(':id')
  async deleteTopup(@Param('id') id: number): Promise<WithdrawResponseDto> {
    return await this.withdrawService.deleteWithdraw(id);
  }
}
