import { PrismaClient } from '@prisma/client';

// ─── Backward compatibility ───────────────────────────────────────────────────
// If DATABASE_URL is not set, try to build it from the legacy Spring Boot
// SPRING_DATASOURCE_* environment variables so existing .env files keep working.
// This block runs before `new PrismaClient()` so Prisma picks up the resolved URL.
if (!process.env.DATABASE_URL) {
  const springUrl  = process.env.SPRING_DATASOURCE_URL;   // jdbc:postgresql://host:5432/db
  const user       = process.env.SPRING_DATASOURCE_USERNAME;
  const pass       = process.env.SPRING_DATASOURCE_PASSWORD;

  if (springUrl && user && pass) {
    // Remove the "jdbc:" prefix → postgresql://host:5432/db
    // Then inject credentials → postgresql://user:pass@host:5432/db
    const withoutJdbc = springUrl.replace(/^jdbc:/, '');
    process.env.DATABASE_URL = withoutJdbc.replace(
      'postgresql://',
      `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@`,
    );
    console.info('[Database] DATABASE_URL built from SPRING_DATASOURCE_* variables.');
  } else {
    console.error(
      '[Database] Neither DATABASE_URL nor SPRING_DATASOURCE_* variables are set. ' +
      'The server will fail to connect. Check your .env file.',
    );
  }
}

/**
 * Singleton Prisma client.
 * Reuses the same instance across the application to avoid exhausting
 * the PostgreSQL connection pool.
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
