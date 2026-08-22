import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import { ProductImagesService } from '../product-images/product-images.service.js';
import { UploadProductImageDto, UploadFileDto } from './dto/upload-file.dto.js';
import { UploadsService } from './uploads.service.js';

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly productImagesService: ProductImagesService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  uploadFile(@UploadedFile() file: UploadFileDto | undefined) {
    if (!file || !file.filename) {
      throw new BadRequestException('No file uploaded');
    }

    return this.uploadsService.saveFile(file);
  }

  @Post('product/:productId')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async uploadProductImage(
    @Param('productId', ParseIntPipe) productId: number,
    @UploadedFile() file: UploadFileDto | undefined,
  ) {
    if (!file || !file.filename) {
      throw new BadRequestException('No file uploaded');
    }

    const savedFile = this.uploadsService.saveFile(file);

    return this.productImagesService.create({
      product_id: productId,
      image: savedFile.url,
      is_primary: false,
    } satisfies UploadProductImageDto);
  }

  @Post('product/:productId/multiple')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async uploadMultipleProductImages(
    @Param('productId', ParseIntPipe) productId: number,
    @UploadedFiles() files: UploadFileDto[] | undefined,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const savedFiles = files
      .filter((file) => file && file.filename)
      .map((file) => this.uploadsService.saveFile(file));

    if (savedFiles.length === 0) {
      throw new BadRequestException('No valid files uploaded');
    }

    const createdImages = await Promise.all(
      savedFiles.map((savedFile) =>
        this.productImagesService.create({
          product_id: productId,
          image: savedFile.url,
          is_primary: false,
        } satisfies UploadProductImageDto),
      ),
    );

    return createdImages;
  }

  @Get(':filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename);

    if (!existsSync(filePath)) {
      throw new BadRequestException(`File not found: ${filename}`);
    }

    return res.sendFile(filePath);
  }
}
