import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from '../../prisma/prisma.module.js';
import { UsersModule } from '../users/users.module.js';
import { HashModule } from '../../common/utils/bcrypt/hash.module.js';
import { JWT_CONFIG } from '../../common/constants/jwt.constants.js';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { PasswordResetService } from './password-reset.service.js';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    HashModule,

    PassportModule,

    JwtModule.register({
      secret: JWT_CONFIG.SECRET,
      signOptions: {
        expiresIn: JWT_CONFIG.EXPIRATION,
      },
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, JwtStrategy, PasswordResetService],

  exports: [AuthService, JwtModule],
})
export class AuthModule {}
