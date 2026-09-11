import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';

export interface UploadedImageFile {
  filename?: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
}

export interface SavedUploadFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
}

@Injectable()
export class UploadsService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  saveFile(file: UploadedImageFile): SavedUploadFile {
    if (!file || !file.filename) {
      throw new BadRequestException('No file uploaded');
    }

    const fileName = file.filename;
    const publicUrl = `/uploads/${fileName}`;

    return {
      filename: fileName,
      originalName: file.originalname ?? fileName,
      mimeType: file.mimetype ?? 'application/octet-stream',
      size: file.size ?? 0,
      path: join(this.uploadDir, fileName),
      url: publicUrl,
    };
  }

  getFilePath(filename: string): string {
    const filePath = join(this.uploadDir, filename);

    if (!existsSync(filePath)) {
      throw new BadRequestException(`File not found: ${filename}`);
    }

    return filePath;
  }
}
