import { Router, Request, Response, NextFunction } from 'express';
import passport from '../config/passport';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import actionsRoutes from './actions.routes';
import chatRoutes from './chat.routes';
import dashboardRoutes from './dashboard.routes';
import healthRoutes from './health.routes';
import { jwtService } from '../services/jwt.service';
import { authService } from '../services/auth.service';
import { generateAppleClientSecret, exchangeAppleCode } from '../config/passport';

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

// ─── OAuth2: Google ───────────────────────────────────────────────────────────

// Initiation: mirrors Spring Security's /oauth2/authorization/google
router.get(
  '/oauth2/authorization/google',
  passport.authenticate('google', { scope: ['openid', 'email', 'profile'], session: false }),
);

// Callback: mirrors Spring Security's /login/oauth2/code/google
router.get(
  '/login/oauth2/code/google',
  passport.authenticate('google', { session: false, failureRedirect: buildFailureUrl('google') }),
  handleOAuthSuccess,
);

// ─── OAuth2: Microsoft ────────────────────────────────────────────────────────

router.get(
  '/oauth2/authorization/microsoft',
  passport.authenticate('microsoft', {
    scope: ['openid', 'email', 'profile', 'User.Read'],
    session: false,
  } as any),
);

router.get(
  '/login/oauth2/code/microsoft',
  passport.authenticate('microsoft', { session: false, failureRedirect: buildFailureUrl('microsoft') } as any),
  handleOAuthSuccess,
);

// ─── OAuth2: Apple (custom — Apple sends POST on first login) ─────────────────

router.get('/oauth2/authorization/apple', (_req: Request, res: Response) => {
  const clientId = process.env.APPLE_CLIENT_ID;
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8080';

  if (!clientId) {
    res.redirect(buildFailureUrl('apple'));
    return;
  }

  try {
    // Build Apple authorization URL manually
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${backendUrl}/login/oauth2/code/apple`,
      response_type: 'code',
      scope: 'name email',
      response_mode: 'form_post', // Apple uses POST for the callback
    });

    res.redirect(`https://appleid.apple.com/auth/authorize?${params.toString()}`);
  } catch (err) {
    console.error('[Apple OAuth2] Failed to build authorization URL:', err);
    res.redirect(buildFailureUrl('apple'));
  }
});

// Apple sends a POST to the callback URL on first login (with user info in body)
router.post('/login/oauth2/code/apple', async (req: Request, res: Response) => {
  const { code, user: userJson } = req.body as { code?: string; user?: string };

  if (!code) {
    res.redirect(buildFailureUrl('apple'));
    return;
  }

  try {
    const tokenClaims = await exchangeAppleCode(code);

    // Apple provides name/email in the POST body only on the FIRST login
    let firstName: string | undefined;
    let lastName: string | undefined;
    let email = tokenClaims.email;

    if (userJson) {
      try {
        const parsed = JSON.parse(userJson) as { name?: { firstName?: string; lastName?: string }; email?: string };
        firstName = parsed.name?.firstName;
        lastName = parsed.name?.lastName;
        email = email ?? parsed.email;
      } catch {
        // userJson parse failure — ignore, we still have the sub
      }
    }

    if (!email) {
      // Private email relay — generate a placeholder
      email = `${tokenClaims.sub}@privaterelay.appleid.com`;
    }

    const dbUser = await authService.upsertOAuthUser({
      provider: 'APPLE',
      providerId: tokenClaims.sub,
      email,
      firstName,
      lastName,
    });

    const token = jwtService.generateToken(dbUser);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4200';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('[Apple OAuth2] Callback failed:', err);
    res.redirect(buildFailureUrl('apple'));
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function handleOAuthSuccess(req: Request, res: Response): void {
  const user = req.user as any;
  if (!user) {
    res.redirect(buildFailureUrl('unknown'));
    return;
  }

  const token = jwtService.generateToken(user);
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4200';
  res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
}

function buildFailureUrl(provider: string): string {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4200';
  return `${frontendUrl}/auth/login?error=oauth2_${provider}_failed`;
}

export default router;
