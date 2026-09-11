import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { HashService } from '../../common/utils/bcrypt/hash.service.js';
import { Inject } from '@nestjs/common';
import { handlePrismaError } from '../../common/utils/error/prisma-error.util.js';
import {
  normalizeEmail,
  normalizeOptionalString,
} from '../../common/utils/string.util.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { serializeUser } from '../../common/utils/serialize-user.util.js';
import { UsersRepository } from './users.repository.js';
import { normalizePagination } from '../../common/helpers/pagination.helper.js';
@Injectable()
export class UsersCrudService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly usersRepository: UsersRepository,
  ) {}

  @Inject(HashService)
  protected readonly hashService!: HashService;

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
    const hashedPassword = await this.hashService.hashPassword(password);
    // -------------------------------------------------------
    // CREATE
    // -------------------------------------------------------
    try {
      const user = await this.usersRepository.create(
        {
          email: normalizedEmail,
          password: hashedPassword,
          name: normalizedName,
          phone: normalizedPhone,
          profile_image: normalizedProfileImage,
          role,
          telegram_chat_id: telegram_chat_id ?? undefined,
        },
        this.safeUserSelect,
      );
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
    const pagination = normalizePagination(
      { page, limit },
      {
        page: UsersCrudService.DEFAULT_PAGE,
        limit: UsersCrudService.DEFAULT_LIMIT,
        maxLimit: UsersCrudService.MAX_LIMIT,
      },
    );
    // -------------------------------------------------------
    // FIND + COUNT
    // -------------------------------------------------------
    const [users, total] = await this.usersRepository.findPage(
      {},
      pagination.skip,
      pagination.limit,
      this.safeUserSelect,
    );
    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------
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
  // COUNT USERS
  // =========================================================
  async count() {
    return this.usersRepository.count();
  }
  // =========================================================
  // GET USER BY ID
  // =========================================================
  async findById(user_id: number) {
    const user = await this.usersRepository.findById(
      user_id,
      this.safeUserSelect,
    );
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
    const user = await this.usersRepository.findByEmail(
      normalizedEmail,
      this.safeUserSelect,
    );
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
      data.password = await this.hashService.hashPassword(password);
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
      const updatedUser = await this.usersRepository.update(
        user_id,
        data,
        this.safeUserSelect,
      );
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
      await this.usersRepository.remove(user_id);
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
