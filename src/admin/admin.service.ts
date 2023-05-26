import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { AdminResponseDto } from './dto/adminResponseDto';
import { AdminDto } from './dto/admin';
import { uniqueOrderNumber } from 'src/utils/uniqueNumber';
import { hashPassword } from 'src/utils/encrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async resultsAdmin(): Promise<AdminResponseDto> {
    try {
      const findUsers = await this.userRepository.find();

      if (findUsers.length < 1) {
        return new AdminResponseDto(404, 'GET', 'data is not exist');
      }

      return new AdminResponseDto(200, 'GET', 'data already exist', findUsers);
    } catch (err) {
      return new AdminResponseDto(
        200,
        'GET',
        'fetch user data failed, internal server error',
      );
    }
  }

  async resultAdmin(id: number): Promise<AdminResponseDto> {
    try {
      const findUser = await this.userRepository.findOneOrFail({
        where: { userId: id },
      });

      return new AdminResponseDto(200, 'GET', 'data already exist', findUser);
    } catch (error) {
      return new AdminResponseDto(404, 'GET', 'user id is not exist');
    }
  }

  async createAdmin(req: AdminDto): Promise<AdminResponseDto> {
    const { email, password, active, role }: AdminDto = req;
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (!existingUser) {
        return new AdminResponseDto(404, 'GET', 'User not found');
      }

      // Create a new admin user
      const adminUser = new User();
      adminUser.email = email;
      adminUser.nocTransfer = parseInt(uniqueOrderNumber());
      adminUser.password = hashPassword(password!);
      adminUser.active = active;
      adminUser.role = role;
      adminUser.createdAt = new Date();

      const saveAdmin = await this.userRepository.save(adminUser);

      if (!saveAdmin) {
        return new AdminResponseDto(
          408,
          'GET',
          'Add new admin user failed, server is busy',
        );
      }

      return new AdminResponseDto(
        200,
        'GET',
        'Add new admin user successfully',
      );
    } catch (err) {
      return new AdminResponseDto(500, 'GET', 'Internal Server Error');
    }
  }

  async updateAdmin(id: number, req: AdminDto): Promise<AdminResponseDto> {
    const { email, password, active, role }: AdminDto = req;
    const checkUserId = await this.userRepository.findOne({
      where: { userId: id },
    });

    if (!checkUserId) {
      return new AdminResponseDto(
        404,
        'GET',
        'user id is not exist, update users data failed',
      );
    }

    checkUserId.email = email;
    checkUserId.nocTransfer = parseInt(uniqueOrderNumber());
    checkUserId.password = password;
    checkUserId.active = active;
    checkUserId.role = role;
    checkUserId.updatedAt = new Date();

    try {
      await this.userRepository.save(checkUserId);
    } catch (error) {
      return new AdminResponseDto(
        408,
        'GET',
        'update user data failed, server is busy',
      );
    }

    return new AdminResponseDto(200, 'GET', 'update user data successfully');
  }

  async deleteAdmin(id: number): Promise<AdminResponseDto> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
    });

    if (!user) {
      return new AdminResponseDto(
        404,
        'GET',
        'user id is not exist, delete users data failed',
      );
    }

    try {
      await this.userRepository.delete(user.userId);
    } catch (error) {
      return new AdminResponseDto(
        408,
        'GET',
        'delete user data failed, server is busy',
      );
    }

    return new AdminResponseDto(200, 'GET', 'delete user data successfully');
  }
}
