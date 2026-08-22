import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { comparePasswords, hashPassword } from '../common/utils/bcrypt.util.js';
import { normalizeEmail } from '../common/utils/string.util.js';
import { handlePrismaError } from '../common/utils/prisma-error.util.js';
import { UsersCrudService } from './users-crud.service.js';

@Injectable()
export class UsersAuthService extends UsersCrudService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  // =========================================================
  // FIND USER FOR AUTH
  // =========================================================

  async findByEmailForAuth(email: string) {
    const normalizedEmail = normalizeEmail(email);

    return this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },

      select: {
        user_id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        profile_image: true,
      },
    });
  }

  // =========================================================
  // VERIFY PASSWORD
  // =========================================================

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.findByEmailForAuth(email);

    if (!user?.password) {
      return false;
    }

    return comparePasswords(password, user.password);
  }

  // =========================================================
  // UPDATE PASSWORD
  // =========================================================

  async updatePassword(user_id: number, newPassword: string) {
    const hashedPassword = await hashPassword(newPassword);

    try {
      await this.prisma.user.update({
        where: {
          user_id,
        },

        data: {
          password: hashedPassword,
        },
      });

      return {
        message: 'Password updated successfully',
      };
    } catch (error) {
      handlePrismaError(error, {
        notFound: `User with ID ${user_id} not found`,
      });
    }
  }
}
