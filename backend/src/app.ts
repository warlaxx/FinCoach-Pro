import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from './config/passport';
import router from './routes';
import { errorHandler, notFoundHandler } from './middleware/errors';

/**
 * Express application factory.
 * Configures middleware, routes, and error handling.
 */
export function createApp(): express.Application {
  const app = express();

  // ─── Security headers ──────────────────────────────────────────────────────
  app.use(helmet({ crossOriginEmbedderPolicy: false }));

  // ─── CORS ─────────────────────────────────────────────────────────────────
  const allowedOrigins = [
    process.env.FRONTEND_URL ?? 'http://localhost:4200',
    'http://localhost:4200',
    'http://localhost:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin ${origin} not allowed.`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ─── Body parsing ──────────────────────────────────────────────────────────
  // express.urlencoded is required for Apple OAuth2 (POST body with form data)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ─── Rate limiting ─────────────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de requêtes. Veuillez réessayer dans 15 minutes.' },
  });

  // Stricter limiter for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.' },
  });

  app.use(limiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/reset-password', authLimiter);

  // ─── Passport (OAuth2 — no session) ───────────────────────────────────────
  app.use(passport.initialize());

  // ─── Routes ───────────────────────────────────────────────────────────────
  app.use(router);

  // ─── 404 & Error handling ──────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
