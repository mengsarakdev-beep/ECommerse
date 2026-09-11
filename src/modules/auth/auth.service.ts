import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { HashService } from '../../common/utils/bcrypt/hash.service.js';
import { validatePasswordStrength } from '../../common/utils/password-validation.util.js';
import { handlePrismaError } from '../../common/utils/error/prisma-error.util.js';
import { AuthMapper } from './auth.mapper.js';
import { PasswordResetService } from './password-reset.service.js';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly hashService: HashService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  // =========================================================
  // GENERATE JWT
  // =========================================================

  private generateToken(user: {
    user_id: string | number;
    email: string;
    role: Role;
  }) {
    return this.jwtService.sign({
      sub: String(user.user_id),
      email: user.email,
      role: user.role,
    });
  }

  // =========================================================
  // REGISTER
  // =========================================================

  async register(registerDto: RegisterDto) {
    const { email: rawEmail, password, name, phone } = registerDto;
    const email = rawEmail.trim().toLowerCase();

    // -------------------------------------------------------
    // PASSWORD VALIDATION
    // -------------------------------------------------------

    const passwordValidation = validatePasswordStrength(password);

    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    // -------------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------------

    const hashedPassword = await this.hashService.hashPassword(password);

    // -------------------------------------------------------
    // USER + CART TRANSACTION
    // -------------------------------------------------------

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name: name ?? null,
            phone: phone ?? null,
            role: Role.USER,
          },

          select: {
            user_id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
          },
        });

        await tx.cart.create({
          data: {
            user_id: newUser.user_id,
          },
        });

        return newUser;
      });

      // -----------------------------------------------------
      // JWT
      // -----------------------------------------------------

      const token = this.generateToken(user);

      // -----------------------------------------------------
      // RESPONSE
      // -----------------------------------------------------

      return AuthMapper.toAuthResponse(
        'User registered successfully',
        token,
        user,
      );
    } catch (error) {
      handlePrismaError(error, {
        unique: 'Email already registered',
      });
    }
  }

  // =========================================================
  // LOGIN
  // =========================================================

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();

    // -------------------------------------------------------
    // FIND USER
    // -------------------------------------------------------

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        user_id: true,
        email: true,
        name: true,
        phone: true,
        password: true,
        role: true,
      },
    });

    // -------------------------------------------------------
    // USER NOT FOUND
    // -------------------------------------------------------

    if (!user?.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // -------------------------------------------------------
    // VERIFY PASSWORD
    // -------------------------------------------------------

    const isPasswordValid = await this.hashService.comparePasswords(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // -------------------------------------------------------
    // JWT
    // -------------------------------------------------------

    const token = this.generateToken(user);

    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

    return AuthMapper.toAuthResponse('Login successful', token, user);
  }

  requestPasswordReset(dto: RequestPasswordResetDto) {
    return this.passwordResetService.request(dto);
  }

  resetPassword(dto: ResetPasswordDto) {
    return this.passwordResetService.reset(dto);
  }
}
