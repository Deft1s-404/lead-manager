import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User } from '@prisma/client';

export interface AuthPayload {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    apiKey: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService
  ) {}

  async register(dto: RegisterDto): Promise<AuthPayload> {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('E-mail ja cadastrado.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      role: dto.role ?? 'user'
    });

    return this.buildAuthPayload(user);
  }

  async login(dto: LoginDto): Promise<AuthPayload> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    return this.buildAuthPayload(user);
  }

  private buildAuthPayload(user: User): AuthPayload {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        apiKey: user.apiKey
      }
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    // Respond success regardless to avoid user enumeration
    if (!user) {
      return;
    }

    // Invalidate previous tokens (optional: delete)
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const raw = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 min

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${raw}&email=${encodeURIComponent(dto.email)}`;
    await this.mail.sendPasswordResetEmail(dto.email, resetUrl);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // generic
      throw new BadRequestException('Token inválido ou expirado.');
    }

    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const token = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!token || token.userId !== user.id) {
      throw new BadRequestException('Token inválido ou expirado.');
    }
    if (token.usedAt || token.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { password: newHash } }),
      this.prisma.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, tokenHash: { not: tokenHash } } })
    ]);
  }
}
