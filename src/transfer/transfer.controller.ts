import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TransferService } from './transfer.service';
import { TransferResponseDto } from './dto/transferResponse';
import { TransferDTO } from './dto/transfer';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { RoleGuard } from 'src/users/role.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('transfer')
export class TransferController {
  constructor(private readonly tranferTopup: TransferService) {}

  @ApiBearerAuth()
  @UseGuards(new AccessTokenGuard())
  @Get()
  async resultsTransfer(): Promise<TransferResponseDto> {
    return await this.tranferTopup.resultsTransfer();
  }

  @ApiBearerAuth()
  @UseGuards(new AccessTokenGuard())
  @Get(':id')
  async resultTransfer(@Param('id') id: number): Promise<TransferResponseDto> {
    return await this.tranferTopup.resultTransfer(id);
  }

  @ApiBearerAuth()
  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Post()
  async createTransfer(@Body() req: TransferDTO): Promise<TransferResponseDto> {
    return await this.tranferTopup.createTransfer(req);
  }

  @ApiBearerAuth()
  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Post(':id')
  async updateTransfer(
    @Param('id') id: number,
    @Body() req: TransferDTO,
  ): Promise<TransferResponseDto> {
    return await this.tranferTopup.updateTransfer(id, req);
  }

  @ApiBearerAuth()
  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Delete(':id')
  async deleteTopup(@Param('id') id: number): Promise<TransferResponseDto> {
    return await this.tranferTopup.deleteTransfer(id);
  }
}
