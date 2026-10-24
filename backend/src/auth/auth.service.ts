import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';

export function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    loyaltyPoints: user.loyaltyPoints,
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email đã được sử dụng');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email,
        phone: dto.phone,
        passwordHash,
      },
    });
    return this.buildSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const ok = user && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!user || !ok) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return this.buildSession(user);
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) 
      throw new UnauthorizedException();
    return toPublicUser(user);
  }

  /**
   * POST /auth/forgot-password
   * Luôn trả cùng một thông báo để không lộ email nào đã đăng ký.
   * Phạm vi bài tập: không gửi email thật, chỉ ghi log mô phỏng dịch vụ gửi
   * mail (không phát token ở đây vì JwtStrategy chấp nhận mọi token cùng secret).
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { 
        email: dto.email 
      },
    });
    if (user) {
      this.logger.log(
        `[MOCK EMAIL] Đã "gửi" liên kết đặt lại mật khẩu tới ${user.email}`,
      );
    }
    return {
      message:
        'Nếu email đã được đăng ký, chúng mình đã gửi liên kết đặt lại mật khẩu.',
    };
  }

  private async buildSession(user: User) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { accessToken, user: toPublicUser(user) };
  }
}
