import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import bcryptjs from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import sgMail from '@sendgrid/mail';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { UserResponseDTO } from './dto/UserResponseDto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto, UsersDTO } from './dto/UserDto';
import { IRegisterMail, IResendMail, IResetMail } from './interface/tempmail';
import { tempMailResend } from 'src/templates/resend';
import { tempMailReset } from 'src/templates/reset';
import { ClientResponse } from '@sendgrid/mail';
import { dateFormat } from 'src/utils/date';
import { randomVCC } from 'src/utils/randomVcc';
import { tempMailRegister } from 'src/templates/register';

@Injectable()
export class UsersService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async activateAccount(email: string): Promise<UserResponseDTO> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          email,
        },
      });

      if (user.active) {
        return new UserResponseDTO(
          200,
          'post',
          'user account has been activated, please log in',
        );
      }

      user.active = true;

      await this.userRepository.update({ email }, user);

      return new UserResponseDTO(
        200,
        'POST',
        'activation account successful, please log in',
      );
    } catch (err) {
      return new UserResponseDTO(
        401,
        'Get',
        'access token expired, please resend new activation token',
      );
    }
  }

  async findEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new UnprocessableEntityException('error');
    }

    return user;
  }

  async forgot(myemail: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findOne({
      where: {
        email: myemail,
      },
    });

    if (!user) {
      return new UserResponseDTO(
        404,
        'POST',
        'User account for this email is not exist, please register',
      );
    }

    if (!user.active) {
      return new UserResponseDTO(
        400,
        'POST',
        'User account is not active, please resend new activation token',
      );
    }

    const { user_id, email }: UsersDTO = user[0];

    const { accessToken }: { accessToken: string } = await this.getTokens(
      user_id,
      email,
    );

    const template: IResetMail = tempMailReset(email, accessToken);

    const sgResponse: [ClientResponse, any] = await sgMail.send(template);

    if (!sgResponse) {
      return new UserResponseDTO(
        500,
        'POST',
        'Server error failed to sending email activation',
      );
    }

    return new UserResponseDTO(
      200,
      'POST',
      `forgot password successfuly, please check your email ${email}`,
    );
  }

  async login(dto: LoginDto): Promise<UserResponseDTO> {
    const user = await this.userRepository.findOne({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      return new UserResponseDTO(
        404,
        'POST',
        'User account does not exist, please register',
      );
    }

    if (!user.active) {
      return new UserResponseDTO(
        400,
        'POST',
        'User account is not active, please resend new activation token',
      );
    }

    const { userId, email, password }: any = user[0];
    const token = this.getTokens(userId, email);

    if (!password) {
      return new UserResponseDTO(
        500,
        'POST',
        `Internal Server Error: password is not defined`,
      );
    }

    this.verifypassword(
      dto.password,
      password,
      async (err: any, success: boolean): Promise<UserResponseDTO> => {
        if (err) {
          return new UserResponseDTO(
            500,
            'POST',
            `Internal Server Error ${err}`,
          );
        }

        if (!success) {
          return new UserResponseDTO(400, 'POST', 'username/password is wrong');
        }

        const updateFirstLogin = await this.userRepository.findOne({
          where: email,
        });

        updateFirstLogin.firstLogin = dateFormat(new Date()).toDate();

        if (updateFirstLogin == null) {
          return new UserResponseDTO(200, 'POST', 'Login successful', token);
        }

        await this.userRepository.save(updateFirstLogin);

        return new UserResponseDTO(
          500,
          'POST',
          `Internal Server Error: verifyPassword function did not return a value`,
        );
      },
    );
  }

  async register(dto: LoginDto): Promise<UserResponseDTO> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      return new UserResponseDTO(
        409,
        'POST',
        'user account already exists, please try again',
      );
    }

    const user = this.userRepository.create({
      email: dto.email,
      password: this.hashPassword(dto.password),
      nocTransfer: randomVCC(),
      createdAt: new Date(),
    });

    const savedUser = await this.userRepository.save(user);

    const { userId } = savedUser;

    const { accessToken }: { accessToken: string } = await this.getTokens(
      userId,
      dto.email,
    );

    const template: IRegisterMail = tempMailRegister(dto.email, accessToken);
    const sgResponse: [ClientResponse, any] = await sgMail.send(template);

    if (!sgResponse) {
      return new UserResponseDTO(
        500,
        'POST',
        'Server error failed to sending email activation',
      );
    }

    return new UserResponseDTO(
      201,
      'POST',
      `create new account successfuly, please check your email ${dto.email}`,
    );
  }

  async resend(email: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return new UserResponseDTO(
        404,
        'POST',
        'User account for this email does not exist, please register',
      );
    }

    if (user.active === true) {
      return new UserResponseDTO(
        200,
        'POST',
        'User account has been activated, please login',
      );
    }

    const { userId } = user;
    const { accessToken }: { accessToken: string } = await this.getTokens(
      userId,
      email,
    );

    const template: IResendMail = tempMailResend(email, accessToken);

    const sgResponse: [ClientResponse, any] = await sgMail.send(template);

    if (!sgResponse) {
      return new UserResponseDTO(
        500,
        'POST',
        'Server error failed to sending email activation',
      );
    }

    return new UserResponseDTO(
      200,
      'POST',
      `resend new token activation successfully, please check your email ${email}`,
    );
  }

  async reset(email: string, password: string): Promise<UserResponseDTO> {
    try {
      const user = this.userRepository
        .createQueryBuilder('user')
        .select('user.password')
        .where('user.email = :email', { email })
        .getOne();

      if (!user) {
        return new UserResponseDTO(
          404,
          'POST',
          'User account does not exist, please register',
        );
      }

      const hashingPassword = this.hashPassword(password);
      const result = await this.userRepository.update(
        { email },
        { password: hashingPassword },
      );

      if (!result.affected) {
        return new UserResponseDTO(
          400,
          'POST',
          'Update password failed, please try again',
        );
      }

      return new UserResponseDTO(
        200,
        'POST',
        'Update password successfully, please login',
      );
    } catch (err) {
      return new UserResponseDTO(
        401,
        'POST',
        'Access token expired, please try forgot password again',
      );
    }
  }

  hashPassword(password: string): string {
    return bcryptjs.hashSync(password, bcryptjs.genSaltSync(10));
  }

  verifypassword(password: string, hashPassword: string, callback: any): void {
    return bcryptjs.compare(
      password,
      hashPassword,
      (err: any, success: boolean): void => callback(err, success),
    );
  }

  async getTokens(userId: number, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
