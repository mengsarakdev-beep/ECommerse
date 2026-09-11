import { PrismaClient } from '../../../generated/prisma/client.js';
import { Role } from '../../../generated/prisma/enums.js';
import { HashService } from '../../common/utils/bcrypt/hash.service.js';
export async function seedAdminUser(prisma: PrismaClient) {
  const hashService = new HashService();
  const password = await hashService.hashPassword('$sarak123$');

  return prisma.user.upsert({
    where: { email: 'meng.sarak.dev@gmail.com' },
    update: {
      password,
      role: Role.ADMIN,
    },
    create: {
      name: 'Admin',
      email: 'meng.sarak.dev@gmail.com',
      password,
      role: Role.ADMIN,
    },
  });
}
