import { Injectable } from '@nestjs/common';

import { Prisma, Role } from '../../../generated/prisma/client.js';

import { CreateUserDto } from './dto/create-user.dto.js';
import { UsersCrudService } from './users-crud.service.js';

import { serializeUser } from '../../common/utils/serialize-user.util.js';
import { handlePrismaError } from '../../common/utils/error/prisma-error.util.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UsersRepository } from './users.repository.js';
import { normalizePagination } from '../../common/helpers/pagination.helper.js';

@Injectable()
export class UsersAdminService extends UsersCrudService {
  constructor(prisma: PrismaService, usersRepository: UsersRepository) {
    super(prisma, usersRepository);
  }

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
      const updatedUser = await this.usersRepository.updateRole(
        user_id,
        role,
        this.safeUserSelect,
      );

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
    const pagination = normalizePagination(
      { page, limit },
      {
        page: UsersCrudService.DEFAULT_PAGE,
        limit: UsersCrudService.DEFAULT_LIMIT,
        maxLimit: UsersCrudService.MAX_LIMIT,
      },
    );

    const [users, total] = await this.usersRepository.findPage(
      { role },
      pagination.skip,
      pagination.limit,
      this.safeUserSelect,
    );

    return {
      data: users.map((user) => serializeUser(user)),

      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
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
    const pagination = normalizePagination(
      { page, limit },
      {
        page: UsersCrudService.DEFAULT_PAGE,
        limit: UsersCrudService.DEFAULT_LIMIT,
        maxLimit: UsersCrudService.MAX_LIMIT,
      },
    );

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return {
        data: [],

        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

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

    const [users, total] = await this.usersRepository.findPage(
      where,
      pagination.skip,
      pagination.limit,
      this.safeUserSelect,
    );

    return {
      data: users.map((user) => serializeUser(user)),

      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }
}
