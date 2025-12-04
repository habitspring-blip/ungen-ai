import { PrismaClient } from '@prisma/client/edge';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg(connectionString);

const prisma = globalThis.prisma || new PrismaClient({ adapter });

if (!globalThis.prisma) {
  globalThis.prisma = prisma;
}

export default prisma;
