import { Module } from '@nestjs/common';
import { UsersCrudService } from './users-crud.service.js';
import { UsersAdminService } from './users-admin.service.js';
import { UsersAuthService } from './users-auth.service.js';
import { UsersRelationsService } from './users-relations.service.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';

@Module({
  providers: [
    UsersCrudService,
    UsersAdminService,
    UsersAuthService,
    UsersRelationsService,
    UsersService,
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
