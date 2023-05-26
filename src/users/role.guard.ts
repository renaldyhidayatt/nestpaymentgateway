import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class RoleGuard implements CanActivate {
  userService: UsersService;
  constructor(private readonly allowedRoles: string[]) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const email = request.user.email;

    const findUser = await this.userService.findEmail(email);

    const userRole = this.getUserRole(findUser.role);

    if (!userRole || !this.allowedRoles.includes(userRole)) {
      throw new UnauthorizedException(
        'Forbidden admin area cannot access this API',
      );
    }

    return true;
  }

  private getUserRole(role_name: string): string | undefined {
    // Lakukan pemetaan role user berdasarkan nama peran
    // Misalnya, Anda dapat menggunakan perbandingan role_name dengan nilai peran yang telah ditentukan

    if (role_name === 'admin') {
      return 'admin';
    } else if (role_name === 'moderator') {
      return 'moderator';
    } else if (role_name === 'user') {
      return 'user';
    }

    return undefined;
  }
}
