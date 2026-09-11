import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client.js';

interface PrismaErrorMessages {
  valueTooLong?: string;
  unique?: string;
  foreignKey?: string;
  notFound?: string;
}

export function handlePrismaError(
  error: unknown,
  messages: PrismaErrorMessages = {},
): never {
  // =========================================================
  // PRISMA KNOWN REQUEST ERROR
  // =========================================================

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      // -------------------------------------------------------
      // P2000
      // Value too long for column
      // -------------------------------------------------------

      case 'P2000':
        throw new BadRequestException(
          messages.valueTooLong ?? 'One or more values are too long',
        );

      // -------------------------------------------------------
      // P2002
      // Unique constraint failed
      // -------------------------------------------------------

      case 'P2002':
        throw new ConflictException(
          messages.unique ?? 'A record with these values already exists',
        );

      // -------------------------------------------------------
      // P2003
      // Foreign key constraint failed
      // -------------------------------------------------------

      case 'P2003':
        throw new BadRequestException(
          messages.foreignKey ?? 'A related record does not exist',
        );

      // -------------------------------------------------------
      // P2025
      // Record required for operation not found
      // -------------------------------------------------------

      case 'P2025':
        throw new NotFoundException(messages.notFound ?? 'Record not found');

      // -------------------------------------------------------
      // Unknown Prisma known error
      // -------------------------------------------------------

      default:
        throw error;
    }
  }

  // =========================================================
  // UNKNOWN ERROR
  // =========================================================

  throw error;
}
