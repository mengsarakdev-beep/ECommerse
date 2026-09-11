import { Injectable } from '@nestjs/common';
import { UsersCrudService } from './users-crud.service.js';
import { UsersAdminService } from './users-admin.service.js';
import { UsersAuthService } from './users-auth.service.js';
import { UsersRelationsService } from './users-relations.service.js';

/**
 * Facade service that aggregates all user-related services.
 * This service acts as the main entry point for the users module.
 *
 * Service hierarchy:
 * - UsersCrudService: Base CRUD operations (create, read, update, delete)
 * - UsersAdminService: Admin operations (extends UsersCrudService, adds admin-specific methods)
 * - UsersAuthService: Authentication operations (extends UsersCrudService)
 * - UsersRelationsService: User relations queries (extends UsersCrudService)
 */
@Injectable()
export class UsersService {
  constructor(
    public readonly crud: UsersCrudService,
    public readonly admin: UsersAdminService,
    public readonly auth: UsersAuthService,
    public readonly relations: UsersRelationsService,
  ) {}
}
