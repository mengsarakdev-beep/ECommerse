import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Category } from '../../../generated/prisma/client.js';
import { CategoriesRepository } from './categories.repository.js';

type CategoryWithProducts = Prisma.CategoryGetPayload<{
  include: { products: true };
}>;
type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: { _count: { select: { products: true } } };
}>;

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async findAll(): Promise<CategoryWithCount[]> {
    return this.categoriesRepository.findAll();
  }

  async findById(category_id: number): Promise<CategoryWithProducts> {
    const category = await this.categoriesRepository.findById(category_id);
    if (!category)
      throw new NotFoundException(`Category with ID ${category_id} not found`);
    return category;
  }

  async create(data: { name: string; slug: string }): Promise<Category> {
    const name = data.name.trim();
    const slug = data.slug.trim().toLowerCase();
    if (!name) throw new BadRequestException('Category name cannot be empty');
    if (!slug) throw new BadRequestException('Category slug cannot be empty');
    try {
      return await this.categoriesRepository.create({ name, slug });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Category with this slug already exists');
      }
      throw error;
    }
  }

  async update(
    category_id: number,
    data: { name?: string; slug?: string },
  ): Promise<Category> {
    const category = await this.categoriesRepository.exists(category_id);
    if (!category)
      throw new NotFoundException(`Category with ID ${category_id} not found`);
    const updateData: Prisma.CategoryUpdateInput = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) throw new BadRequestException('Category name cannot be empty');
      updateData.name = name;
    }
    if (data.slug !== undefined) {
      const slug = data.slug.trim().toLowerCase();
      if (!slug) throw new BadRequestException('Category slug cannot be empty');
      updateData.slug = slug;
    }
    if (Object.keys(updateData).length === 0)
      throw new BadRequestException('No fields provided for update');
    try {
      return await this.categoriesRepository.update(category_id, updateData);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Category with this slug already exists');
      }
      throw error;
    }
  }

  async remove(category_id: number): Promise<Category> {
    const category = await this.categoriesRepository.exists(category_id);
    if (!category)
      throw new NotFoundException(`Category with ID ${category_id} not found`);
    const productsCount =
      await this.categoriesRepository.countProducts(category_id);
    if (productsCount > 0)
      throw new BadRequestException(
        `Cannot delete category. ${productsCount} product(s) are assigned to this category`,
      );
    return this.categoriesRepository.remove(category_id);
  }
}
