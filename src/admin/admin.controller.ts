import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { AdminResponseDto } from './dto/adminResponseDto';
import { RoleGuard } from 'src/users/role.guard';
import { AdminDto } from './dto/admin';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(new AccessTokenGuard())
  @Get()
  async resultsAdmin(): Promise<AdminResponseDto> {
    return await this.adminService.resultsAdmin();
  }

  @UseGuards(new AccessTokenGuard())
  @Get(':id')
  async resultAdmin(@Param('id') id: number): Promise<AdminResponseDto> {
    return await this.adminService.resultAdmin(id);
  }

  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Post()
  async createAdmin(@Body() req: AdminDto): Promise<AdminResponseDto> {
    return await this.adminService.createAdmin(req);
  }

  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Post()
  async updateAdmin(
    @Param('id') id: number,
    @Body() req: AdminDto,
  ): Promise<AdminResponseDto> {
    return await this.adminService.updateAdmin(id, req);
  }

  @UseGuards(new AccessTokenGuard(), new RoleGuard(['admin', 'moderator']))
  @Post()
  async deleteAdmin(@Param('id') id: number): Promise<AdminResponseDto> {
    return await this.adminService.deleteAdmin(id);
  }
}
