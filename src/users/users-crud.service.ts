import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, Role } from '../../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { hashPassword } from '../common/utils/bcrypt.util.js';

import { handlePrismaError } from '../common/utils/prisma-error.util.js';

import {
  normalizeEmail,
  normalizeOptionalString,
} from '../common/utils/string.util.js';

import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

import { serializeUser } from '../common/utils/serialize-user.util.js';

@Injectable()
export class UsersCrudService {
  constructor(protected readonly prisma: PrismaService) {}

  // =========================================================
  // CONSTANTS
  // =========================================================

  protected static readonly DEFAULT_PAGE = 1;
  protected static readonly DEFAULT_LIMIT = 20;
  protected static readonly MAX_LIMIT = 100;
  // =========================================================
  // SAFE USER SELECT
  // =========================================================

  protected readonly safeUserSelect = {
    user_id: true,
    email: true,
    name: true,
    phone: true,
    profile_image: true,
    telegram_chat_id: true,
    role: true,
    created_at: true,
    updated_at: true,
  } as const;

  // =========================================================
  // CREATE USER HELPER
  // =========================================================

  protected async createUserWithRole(createUserDto: CreateUserDto, role: Role) {
    const { email, password, name, phone, profile_image, telegram_chat_id } =
      createUserDto;

    // -------------------------------------------------------
    // NORMALIZE
    // -------------------------------------------------------

    const normalizedEmail = normalizeEmail(email);

    const normalizedName = normalizeOptionalString(name);

    const normalizedPhone = normalizeOptionalString(phone);

    const normalizedProfileImage = normalizeOptionalString(profile_image);

    // -------------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------------

    const hashedPassword = await hashPassword(password);

    // -------------------------------------------------------
    // CREATE
    // -------------------------------------------------------

    try {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: normalizedName,
          phone: normalizedPhone,
          profile_image: normalizedProfileImage,
          role,
          telegram_chat_id: telegram_chat_id ?? undefined,
        },

        select: this.safeUserSelect,
      });

      return serializeUser(user);
    } catch (error) {
      handlePrismaError(error, {
        valueTooLong: 'User data is too long',
        unique: 'User with this email already exists',
      });
    }
  }

  // =========================================================
  // CREATE USER
  // =========================================================

  async create(createUserDto: CreateUserDto) {
    return this.createUserWithRole(createUserDto, Role.USER);
  }

  // =========================================================
  // GET ALL USERS
  // =========================================================

  async findAll(
    page = UsersCrudService.DEFAULT_PAGE,
    limit = UsersCrudService.DEFAULT_LIMIT,
  ) {
    // -------------------------------------------------------
    // SAFE PAGINATION
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // FIND + COUNT
    // -------------------------------------------------------

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: safeLimit,

        select: this.safeUserSelect,

        orderBy: {
          created_at: 'desc',
        },
      }),

      this.prisma.user.count(),
    ]);

    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

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
  // COUNT USERS
  // =========================================================

  async count() {
    return this.prisma.user.count();
  }

  // =========================================================
  // GET USER BY ID
  // =========================================================

  async findById(user_id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        user_id,
      },

      select: this.safeUserSelect,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    return serializeUser(user);
  }

  // =========================================================
  // GET USER BY EMAIL
  // =========================================================

  async findByEmail(email: string) {
    const user = await this.findByEmailOptional(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // =========================================================
  // GET USER BY EMAIL OPTIONAL
  // =========================================================

  async findByEmailOptional(email: string) {
    const normalizedEmail = normalizeEmail(email);

    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },

      select: this.safeUserSelect,
    });

    return user ? serializeUser(user) : null;
  }

  // =========================================================
  // UPDATE USER
  // =========================================================

  async update(user_id: number, updateUserDto: UpdateUserDto) {
    // -------------------------------------------------------
    // EXTRACT FIELDS
    // -------------------------------------------------------

    const { email, password, name, phone, profile_image, telegram_chat_id } =
      updateUserDto;

    const data: Prisma.UserUpdateInput = {};

    // -------------------------------------------------------
    // EMAIL
    // -------------------------------------------------------

    if (email !== undefined) {
      data.email = normalizeEmail(email);
    }

    // -------------------------------------------------------
    // NAME
    // -------------------------------------------------------

    if (name !== undefined) {
      data.name = normalizeOptionalString(name);
    }

    // -------------------------------------------------------
    // PHONE
    // -------------------------------------------------------

    if (phone !== undefined) {
      data.phone = normalizeOptionalString(phone);
    }

    // -------------------------------------------------------
    // PROFILE IMAGE
    // -------------------------------------------------------

    if (profile_image !== undefined) {
      data.profile_image = normalizeOptionalString(profile_image);
    }

    // -------------------------------------------------------
    // TELEGRAM CHAT ID
    // -------------------------------------------------------

    if (telegram_chat_id !== undefined) {
      data.telegram_chat_id = telegram_chat_id;
    }

    // -------------------------------------------------------
    // PASSWORD
    // -------------------------------------------------------

    if (password !== undefined) {
      data.password = await hashPassword(password);
    }

    // -------------------------------------------------------
    // EMPTY UPDATE
    // -------------------------------------------------------

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided for update');
    }

    // -------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------

    try {
      const updatedUser = await this.prisma.user.update({
        where: {
          user_id,
        },

        data,

        select: this.safeUserSelect,
      });

      return serializeUser(updatedUser);
    } catch (error) {
      handlePrismaError(error, {
        valueTooLong: 'User data is too long',

        unique: 'User with this email already exists',

        notFound: `User with ID ${user_id} not found`,
      });
    }
  }

  // =========================================================
  // DELETE USER
  // =========================================================

  async remove(user_id: number) {
    try {
      await this.prisma.user.delete({
        where: {
          user_id,
        },
      });

      return {
        message: 'User deleted successfully',
      };
    } catch (error) {
      handlePrismaError(error, {
        foreignKey: 'Cannot delete user because related records exist',

        notFound: `User with ID ${user_id} not found`,
      });
    }
  }
}
