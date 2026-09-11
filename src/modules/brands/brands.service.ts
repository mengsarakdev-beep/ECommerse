import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';
import { QueryBrandDto } from './dto/query-brand.dto.js';
import { BrandsRepository } from './brands.repository.js';

type BrandWithProducts = Prisma.BrandGetPayload<{
  include: { products: true };
}>;

@Injectable()
export class BrandsService {
  constructor(private readonly brandsRepository: BrandsRepository) {}

  async findAll(query: QueryBrandDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();
    const where: Prisma.BrandWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    const [brands, total] = await this.brandsRepository.findPage(
      where,
      (page - 1) * limit,
      limit,
    );
    return {
      data: brands,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(brand_id: number): Promise<BrandWithProducts> {
    const brand = await this.brandsRepository.findById(brand_id);
    if (!brand)
      throw new NotFoundException(`Brand with ID ${brand_id} not found`);
    return brand;
  }

  async create(data: CreateBrandDto) {
    const name = data.name.trim();
    const slug = data.slug.trim().toLowerCase();
    if (!name) throw new BadRequestException('Brand name cannot be empty');
    if (!slug) throw new BadRequestException('Brand slug cannot be empty');
    try {
      return await this.brandsRepository.create({
        name,
        slug,
        description: data.description?.trim() || null,
        logo: data.logo?.trim() || null,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Brand name or slug already exists');
      }
      throw error;
    }
  }

  async update(brand_id: number, data: UpdateBrandDto) {
    const brand = await this.brandsRepository.exists(brand_id);
    if (!brand)
      throw new NotFoundException(`Brand with ID ${brand_id} not found`);
    const updateData: Prisma.BrandUpdateInput = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) throw new BadRequestException('Brand name cannot be empty');
      updateData.name = name;
    }
    if (data.slug !== undefined) {
      const slug = data.slug.trim().toLowerCase();
      if (!slug) throw new BadRequestException('Brand slug cannot be empty');
      updateData.slug = slug;
    }
    if (data.description !== undefined)
      updateData.description = data.description?.trim() || null;
    if (data.logo !== undefined) updateData.logo = data.logo?.trim() || null;
    if (Object.keys(updateData).length === 0)
      throw new BadRequestException('No fields provided for update');
    try {
      return await this.brandsRepository.update(brand_id, updateData);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Brand name or slug already exists');
      }
      throw error;
    }
  }

  async remove(brand_id: number) {
    const brand = await this.brandsRepository.exists(brand_id);
    if (!brand)
      throw new NotFoundException(`Brand with ID ${brand_id} not found`);
    const productsCount = await this.brandsRepository.countProducts(brand_id);
    if (productsCount > 0)
      throw new BadRequestException(
        `Cannot delete brand. ${productsCount} product(s) are assigned to this brand`,
      );
    await this.brandsRepository.remove(brand_id);
  }
}
