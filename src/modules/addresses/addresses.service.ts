import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';
import { AddressesRepository } from './addresses.repository.js';

@Injectable()
export class AddressesService {
  constructor(private readonly addressesRepository: AddressesRepository) {}

  private readonly userSelect = {
    user_id: true,
    name: true,
    email: true,
    phone: true,
    profile_image: true,
  } as const;

  async findAll() {
    return this.addressesRepository.findAll();
  }

  async findById(address_id: number) {
    const address = await this.addressesRepository.findById(address_id);

    if (!address) {
      throw new NotFoundException(`Address with ID ${address_id} not found`);
    }

    return address;
  }

  async findByUserId(user_id: number) {
    const user = await this.addressesRepository.findUserById(user_id);

    if (!user) {
      return [];
    }

    return this.addressesRepository.findByUserId(user_id);
  }

  async create(createAddressDto: CreateAddressDto) {
    const {
      user_id,
      recipient_name,
      phone,
      province,
      district,
      commune,
      street,
      is_default = false,
    } = createAddressDto;

    const address = await this.addressesRepository.create({
      user_id,
      recipient_name,
      phone,
      province: province ?? null,
      district: district ?? null,
      commune: commune ?? null,
      street: street ?? null,
      is_default,
    });

    if (!address) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    return address;
  }

  async update(address_id: number, updateAddressDto: UpdateAddressDto) {
    const data = { ...updateAddressDto };
    delete data.user_id;

    const address = await this.addressesRepository.update(address_id, data);

    if (!address) {
      throw new NotFoundException(`Address with ID ${address_id} not found`);
    }

    return address;
  }

  async remove(address_id: number) {
    const address = await this.addressesRepository.findById(address_id);

    if (!address) {
      throw new NotFoundException(`Address with ID ${address_id} not found`);
    }

    return this.addressesRepository.remove(address_id);
  }
}
