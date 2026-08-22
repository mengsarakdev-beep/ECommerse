import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Role } from '../../generated/prisma/enums.js';

import { UsersService } from './users.service.js';

import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { PaginationDto } from './dto/pagination.dto.js';
import { SearchUsersDto } from './dto/search-users.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private getPagination(paginationDto: PaginationDto): [number, number] {
    const pagination = paginationDto as unknown as Record<string, unknown>;

    return [Number(pagination.page ?? 1), Number(pagination.limit ?? 20)];
  }

  // =========================================================
  // CREATE USER
  // POST /users
  // ADMIN ONLY
  // =========================================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.crud.create(createUserDto);
  }

  // =========================================================
  // GET ALL USERS
  // GET /users?page=1&limit=20
  // ADMIN ONLY
  // =========================================================

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    const [page, limit] = this.getPagination(paginationDto);

    return this.usersService.crud.findAll(page, limit);
  }

  // =========================================================
  // COUNT USERS
  // GET /users/count
  // ADMIN ONLY
  // =========================================================

  @Get('count')
  count() {
    return this.usersService.crud.count();
  }

  // =========================================================
  // SEARCH USERS
  // GET /users/search?query=sarak&page=1&limit=20
  // ADMIN ONLY
  // =========================================================

  @Get('search')
  search(@Query() searchDto: SearchUsersDto) {
    const [page, limit] = this.getPagination(searchDto);

    return this.usersService.admin.search(searchDto.query ?? '', page, limit);
  }

  // =========================================================
  // GET USERS BY ROLE
  // GET /users/role/ADMIN?page=1&limit=20
  // ADMIN ONLY
  // =========================================================

  @Get('role/:role')
  findByRole(
    @Param('role', new ParseEnumPipe(Role))
    role: Role,
    @Query() paginationDto: PaginationDto,
  ) {
    const [page, limit] = this.getPagination(paginationDto);

    return this.usersService.admin.findByRole(role, page, limit);
  }

  // =========================================================
  // GET USER ADDRESSES
  // GET /users/1/addresses
  // ADMIN ONLY
  // =========================================================

  @Get(':id/addresses')
  getUserAddresses(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.relations.getUserAddresses(id);
  }

  // =========================================================
  // GET USER ORDERS
  // GET /users/1/orders?page=1&limit=20
  // ADMIN ONLY
  // =========================================================

  @Get(':id/orders')
  getUserOrders(
    @Param('id', ParseIntPipe) id: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const [page, limit] = this.getPagination(paginationDto);

    return this.usersService.relations.getUserOrders(id, page, limit);
  }

  // =========================================================
  // GET USER REVIEWS
  // GET /users/1/reviews?page=1&limit=20
  // ADMIN ONLY
  // =========================================================

  @Get(':id/reviews')
  getUserReviews(
    @Param('id', ParseIntPipe) id: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const [page, limit] = this.getPagination(paginationDto);

    return this.usersService.relations.getUserReviews(id, page, limit);
  }

  // =========================================================
  // GET USER CART
  // GET /users/1/cart
  // ADMIN ONLY
  // =========================================================

  @Get(':id/cart')
  getUserCart(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.relations.getUserCart(id);
  }

  // =========================================================
  // GET USER WISHLISTS
  // GET /users/1/wishlists?page=1&limit=20
  // ADMIN ONLY
  // =========================================================

  @Get(':id/wishlists')
  getUserWishlists(
    @Param('id', ParseIntPipe) id: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const [page, limit] = this.getPagination(paginationDto);

    return this.usersService.relations.getUserWishlists(id, page, limit);
  }

  // =========================================================
  // GET USER BY ID
  // GET /users/1
  // ADMIN ONLY
  // =========================================================

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.crud.findById(id);
  }

  // =========================================================
  // UPDATE USER ROLE
  // PATCH /users/1/role
  // ADMIN ONLY
  // =========================================================

  @Patch(':id/role')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.usersService.admin.updateRole(id, updateRoleDto.role);
  }

  // =========================================================
  // UPDATE USER
  // PATCH /users/1
  // ADMIN ONLY
  // =========================================================

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.crud.update(id, updateUserDto);
  }

  // =========================================================
  // DELETE USER
  // DELETE /users/1
  // ADMIN ONLY
  // =========================================================

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usersService.crud.remove(id);
  }
}
