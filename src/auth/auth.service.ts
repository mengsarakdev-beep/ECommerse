import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { Role } from '../../generated/prisma/enums.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

import { hashPassword, comparePasswords } from '../common/utils/bcrypt.util.js';

import { validatePasswordStrength } from '../common/utils/password-validation.util.js';

import { handlePrismaError } from '../common/utils/prisma-error.util.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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

    const hashedPassword = await hashPassword(password);

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

      return {
        message: 'User registered successfully',
        token,
        user,
      };
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

    const isPasswordValid = await comparePasswords(
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

    return {
      message: 'Login successful',

      token,

      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}
