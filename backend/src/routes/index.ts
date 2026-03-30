import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import actionsRoutes from './actions.routes';
import chatRoutes from './chat.routes';
import dashboardRoutes from './dashboard.routes';
import healthRoutes from './health.routes';

const router = Router();

// ─── Health ───────────────────────────────────────────────────────────────────
router.use('/api/health', healthRoutes);

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.use('/api/auth', authRoutes);

// ─── Profile ──────────────────────────────────────────────────────────────────
router.use('/api/profile', profileRoutes);

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.use('/api/dashboard', dashboardRoutes);

// ─── Actions ──────────────────────────────────────────────────────────────────
router.use('/api/actions', actionsRoutes);

// ─── Chat ─────────────────────────────────────────────────────────────────────
router.use('/api/chat', chatRoutes);

// ─── OAuth2 (Google / Microsoft / Apple) — désactivé temporairement ──────────
// Pour réactiver : décommenter les blocs ci-dessous et restaurer les imports
// passport, jwtService, authService, generateAppleClientSecret, exchangeAppleCode

/*
router.get('/oauth2/authorization/google',
  passport.authenticate('google', { scope: ['openid', 'email', 'profile'], session: false }));

router.get('/login/oauth2/code/google',
  passport.authenticate('google', { session: false, failureRedirect: buildFailureUrl('google') }),
  handleOAuthSuccess);

router.get('/oauth2/authorization/microsoft',
  passport.authenticate('microsoft', { scope: ['openid', 'email', 'profile', 'User.Read'], session: false } as any));

router.get('/login/oauth2/code/microsoft',
  passport.authenticate('microsoft', { session: false, failureRedirect: buildFailureUrl('microsoft') } as any),
  handleOAuthSuccess);

router.get('/oauth2/authorization/apple', ...);
router.post('/login/oauth2/code/apple', ...);

function handleOAuthSuccess(req: Request, res: Response): void { ... }
function buildFailureUrl(provider: string): string { ... }
*/

export default router;
