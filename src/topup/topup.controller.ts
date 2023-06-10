import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TopupService } from './topup.service';
import { TopupDto, TopupResponseDto } from './dto/topup';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { RoleGuard } from 'src/users/role.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('topup')
export class TopupController {
  constructor(private readonly topService: TopupService) {}

  @ApiBearerAuth()
  @UseGuards(new AccessTokenGuard())
  @Get()
  async resultsTopup(): Promise<TopupResponseDto> {
    return await this.topService.resultsTopup();
  }

  @ApiBearerAuth()
  @UseGuards(new AccessTokenGuard())
  @Get(':id')
  async resultTopup(@Param('id') id: number): Promise<TopupResponseDto> {
    return await this.topService.resultTopup(id);
  }

  @ApiBearerAuth()
  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Post()
  async createTopup(@Body() req: TopupDto): Promise<TopupResponseDto> {
    return await this.topService.createTopup(req);
  }

  @ApiBearerAuth()
  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Post(':id')
  async updateTopup(
    @Param('id') id: number,
    @Body() req: TopupDto,
  ): Promise<TopupResponseDto> {
    return await this.topService.updateTopup(id, req);
  }

  @ApiBearerAuth()
  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Delete(':id')
  async deleteTopup(@Param('id') id: number): Promise<TopupResponseDto> {
    return await this.topService.deleteTopup(id);
  }
}
