import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend/ root (one level up from dist/).
// Prisma CLI also reads backend/.env automatically when run from backend/.
// In Docker, vars are injected by docker-compose — dotenv no-ops if file missing.
dotenv.config({ path: path.join(__dirname, '../.env') });

import { createApp } from './app';
import prisma from './config/database';
import { createLogger } from './utils/logger';

const logger = createLogger('Server');
const PORT = parseInt(process.env.PORT ?? '8080', 10);

async function main(): Promise<void> {
  logger.info('Starting FinCoach API', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV ?? 'production',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:4200',
    logLevel: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO'),
  });

  // Verify database connectivity before accepting traffic
  try {
    logger.info('Connecting to PostgreSQL via Prisma...');
    await prisma.$connect();
    logger.info('PostgreSQL connected successfully');
  } catch (err) {
    logger.error('Failed to connect to the database — shutting down', {
      error: (err as Error).message,
      stack: (err as Error).stack,
    });
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(PORT, () => {
    logger.info(`FinCoach API is ready and accepting traffic`, {
      port: PORT,
      nodeEnv: process.env.NODE_ENV ?? 'production',
    });
  });

  // ─── Graceful shutdown ────────────────────────────────────────────────────

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — starting graceful shutdown...`);
    server.close(async () => {
      logger.info('HTTP server closed, disconnecting database...');
      await prisma.$disconnect();
      logger.info('Database disconnected. Shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception — process may be in an unstable state', {
      error: err.message,
      stack: err.stack,
    });
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}

main();
