import { Injectable } from '@nestjs/common';

import { Prisma, Role } from '../../generated/prisma/client.js';

import { CreateUserDto } from './dto/create-user.dto.js';
import { UsersCrudService } from './users-crud.service.js';

import { serializeUser } from '../common/utils/serialize-user.util.js';
import { handlePrismaError } from '../common/utils/prisma-error.util.js';

@Injectable()
export class UsersAdminService extends UsersCrudService {
  // =========================================================
  // CREATE ADMIN
  // =========================================================

  async createAdmin(createUserDto: CreateUserDto) {
    return this.createUserWithRole(createUserDto, Role.ADMIN);
  }

  // =========================================================
  // UPDATE USER ROLE
  // =========================================================

  async updateRole(user_id: number, role: Role) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: {
          user_id,
        },

        data: {
          role,
        },

        select: this.safeUserSelect,
      });

      return serializeUser(updatedUser);
    } catch (error) {
      handlePrismaError(error, {
        notFound: `User with ID ${user_id} not found`,
      });
    }
  }

  // =========================================================
  // FIND USERS BY ROLE
  // =========================================================

  async findByRole(
    role: Role,
    page = UsersCrudService.DEFAULT_PAGE,
    limit = UsersCrudService.DEFAULT_LIMIT,
  ) {
    const requestedPage = Number(page);
    const requestedLimit = Number(limit);

    const safePage =
      Number.isFinite(requestedPage) && requestedPage > 0
        ? Math.floor(requestedPage)
        : UsersCrudService.DEFAULT_PAGE;

    const safeLimit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), UsersCrudService.MAX_LIMIT)
        : UsersCrudService.DEFAULT_LIMIT;

    const skip = (safePage - 1) * safeLimit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: {
          role,
        },

        skip,
        take: safeLimit,

        select: this.safeUserSelect,

        orderBy: {
          created_at: 'desc',
        },
      }),

      this.prisma.user.count({
        where: {
          role,
        },
      }),
    ]);

    return {
      data: users.map((user) => serializeUser(user)),

      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  // =========================================================
  // SEARCH USERS
  // =========================================================

  async search(
    query: string,
    page = UsersCrudService.DEFAULT_PAGE,
    limit = UsersCrudService.DEFAULT_LIMIT,
  ) {
    const requestedPage = Number(page);
    const requestedLimit = Number(limit);

    const safePage =
      Number.isFinite(requestedPage) && requestedPage > 0
        ? Math.floor(requestedPage)
        : UsersCrudService.DEFAULT_PAGE;

    const safeLimit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), UsersCrudService.MAX_LIMIT)
        : UsersCrudService.DEFAULT_LIMIT;

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return {
        data: [],

        meta: {
          page: safePage,
          limit: safeLimit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.UserWhereInput = {
      OR: [
        {
          name: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },

        {
          email: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
      ],
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,

        skip,
        take: safeLimit,

        select: this.safeUserSelect,

        orderBy: {
          created_at: 'desc',
        },
      }),

      this.prisma.user.count({
        where,
      }),
    ]);

    return {
      data: users.map((user) => serializeUser(user)),

      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }
}
