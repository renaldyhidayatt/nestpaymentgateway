import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SaldoService } from './saldo.service';
import { SaldoDto, SaldoResponseDto } from './dto/saldo';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { RoleGuard } from 'src/users/role.guard';

@Controller('saldo')
export class SaldoController {
  constructor(private readonly saldoService: SaldoService) {}

  @UseGuards(new AccessTokenGuard())
  @Get()
  async resultsSaldo(): Promise<SaldoResponseDto> {
    return await this.saldoService.resultsSaldo();
  }

  @UseGuards(new AccessTokenGuard())
  @Get(':id')
  async resultSaldo(@Param('id') id: number): Promise<SaldoResponseDto> {
    return await this.saldoService.resultSaldo(id);
  }

  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Post()
  async createSaldo(@Body() req: SaldoDto): Promise<SaldoResponseDto> {
    return await this.saldoService.createSaldo(req);
  }

  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Post()
  async updateSaldo(
    @Param('id') id: number,
    @Body() req: SaldoDto,
  ): Promise<SaldoResponseDto> {
    return await this.saldoService.updateSaldo(id, req);
  }

  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Post()
  async deleteSaldo(@Param('id') id: number): Promise<SaldoResponseDto> {
    return await this.saldoService.deleteSaldo(id);
  }
}
