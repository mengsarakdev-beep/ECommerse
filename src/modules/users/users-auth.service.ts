import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { normalizeEmail } from '../../common/utils/string.util.js';
import { handlePrismaError } from '../../common/utils/error/prisma-error.util.js';
import { UsersCrudService } from './users-crud.service.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersAuthService extends UsersCrudService {
  constructor(
    protected readonly prisma: PrismaService,
    usersRepository: UsersRepository,
  ) {
    super(prisma, usersRepository);
  }

  // =========================================================
  // FIND USER FOR AUTH
  // =========================================================

  async findByEmailForAuth(email: string) {
    const normalizedEmail = normalizeEmail(email);

    return this.usersRepository.findForAuth(normalizedEmail);
  }

  // =========================================================
  // VERIFY PASSWORD
  // =========================================================

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.findByEmailForAuth(email);

    if (!user?.password) {
      return false;
    }

    return this.hashService.comparePasswords(password, user.password);
  }

  // =========================================================
  // UPDATE PASSWORD
  // =========================================================

  async updatePassword(user_id: number, newPassword: string) {
    const hashedPassword = await this.hashService.hashPassword(newPassword);

    try {
      await this.usersRepository.updatePassword(user_id, hashedPassword);

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
