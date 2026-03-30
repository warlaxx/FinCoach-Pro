import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client.
 * Reuses the same instance across the application to avoid exhausting
 * the PostgreSQL connection pool.
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
