import 'dotenv/config';
import { PrismaService } from './prisma/prisma.service.js';
import { seedAdminUser } from './db/seeds/user.seed.js';

async function main() {
  const prisma = new PrismaService();

  try {
    await seedAdminUser(prisma);
    console.log('Database seeding completed successfully.');
  } finally {
    await prisma.$disconnect();
  }
}

await main();
