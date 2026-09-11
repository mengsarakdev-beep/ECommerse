import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AddressesService } from './addresses.service.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
interface AuthenticatedRequest extends Request {
  user: {
    user_id: number;
  };
}
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  findAll() {
    return this.addressesService.findAll();
  }

  @Get('me')
  findMyAddresses(@Req() req: AuthenticatedRequest) {
    return this.addressesService.findByUserId(req.user.user_id);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.addressesService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.addressesService.create({
      ...createAddressDto,
      user_id: req.user.user_id,
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.update(id, updateAddressDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.addressesService.remove(id);
  }
}
