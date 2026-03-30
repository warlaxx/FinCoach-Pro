import 'dotenv/config';
import { createApp } from './app';
import prisma from './config/database';

const PORT = parseInt(process.env.PORT ?? '8080', 10);

async function main(): Promise<void> {
  // Verify database connectivity before accepting traffic
  try {
    await prisma.$connect();
    console.info('[Server] PostgreSQL connected via Prisma.');
  } catch (err) {
    console.error('[Server] Failed to connect to the database:', err);
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(PORT, () => {
    console.info(`[Server] FinCoach API running on port ${PORT}`);
    console.info(`[Server] Environment: ${process.env.NODE_ENV ?? 'production'}`);
    console.info(`[Server] Frontend URL: ${process.env.FRONTEND_URL ?? 'http://localhost:4200'}`);
  });

  // ─── Graceful shutdown ────────────────────────────────────────────────────

  const shutdown = async (signal: string): Promise<void> => {
    console.info(`[Server] ${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.info('[Server] Database disconnected. Bye!');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
