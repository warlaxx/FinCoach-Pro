import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { authService } from '../services/auth.service';
import { OAuthUserProfile } from '../types';

/**
 * Configures Passport.js OAuth2 strategies.
 *
 * - Google: passport-google-oauth20 (standard OIDC)
 * - Microsoft: passport-oauth2 (configured with Microsoft v2.0 endpoints)
 * - Apple: custom route handlers (Apple has non-standard OAuth2 requirements)
 *
 * After any successful OAuth2 authentication, we upsert the user
 * in our database and generate our own JWT (not the provider's token).
 */

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

// ─── Google ───────────────────────────────────────────────────────────────────

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret) {
  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: `${BACKEND_URL}/login/oauth2/code/google`,
        scope: ['openid', 'email', 'profile'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const oauthProfile: OAuthUserProfile = {
            provider: 'GOOGLE',
            providerId: profile.id,
            email: profile.emails?.[0]?.value ?? '',
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            name: profile.displayName,
            pictureUrl: profile.photos?.[0]?.value,
          };
          const user = await authService.upsertOAuthUser(oauthProfile);
          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );
  console.info('[Passport] Google OAuth2 strategy registered.');
} else {
  console.warn('[Passport] GOOGLE_CLIENT_ID/SECRET not set — Google OAuth2 disabled.');
}

// ─── Microsoft ────────────────────────────────────────────────────────────────

const msClientId = process.env.MICROSOFT_CLIENT_ID;
const msClientSecret = process.env.MICROSOFT_CLIENT_SECRET;

if (msClientId && msClientSecret) {
  passport.use(
    'microsoft',
    new OAuth2Strategy(
      {
        authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        clientID: msClientId,
        clientSecret: msClientSecret,
        callbackURL: `${BACKEND_URL}/login/oauth2/code/microsoft`,
        scope: ['openid', 'email', 'profile', 'User.Read'],
      },
      // passport-oauth2 verify: (accessToken, refreshToken, results, profile, done)
      (accessToken: string, _refreshToken: string, _results: any, _profile: any, done: any) => {
        axios
          .get('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          .then(async (graphRes) => {
            const msUser = graphRes.data as {
              id: string;
              mail?: string;
              userPrincipalName?: string;
              givenName?: string;
              surname?: string;
              displayName?: string;
            };

            const email = msUser.mail ?? msUser.userPrincipalName ?? '';
            if (!email) throw new Error('Microsoft account has no email address.');

            const oauthProfile: OAuthUserProfile = {
              provider: 'MICROSOFT',
              providerId: msUser.id,
              email,
              firstName: msUser.givenName,
              lastName: msUser.surname,
              name: msUser.displayName,
            };

            return authService.upsertOAuthUser(oauthProfile);
          })
          .then((user) => done(null, user))
          .catch((err: Error) => done(err));
      },
    ),
  );
  console.info('[Passport] Microsoft OAuth2 strategy registered.');
} else {
  console.warn('[Passport] MICROSOFT_CLIENT_ID/SECRET not set — Microsoft OAuth2 disabled.');
}

// ─── Session stubs (we use JWT, not sessions) ─────────────────────────────────

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => done(null, { id }));

export default passport;

// ─── Apple OAuth2 helpers ──────────────────────────────────────────────────────
// Apple's OAuth2 requires a custom JWT as client_secret (signed with ES256).
// We implement this as standalone functions used by the Apple route handlers.

export function generateAppleClientSecret(): string {
  const teamId = process.env.APPLE_TEAM_ID;
  const clientId = process.env.APPLE_CLIENT_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY;

  if (!teamId || !clientId || !keyId || !privateKey) {
    throw new Error('Apple OAuth2 credentials not configured.');
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 15_777_000; // ~6 months (Apple's maximum)

  // The private key comes from Apple as a PKCS#8 PEM.
  // It may be stored as a single-line string with \n escaped as \\n.
  const pem = privateKey.replace(/\\n/g, '\n');

  return jwt.sign(
    {
      iss: teamId,
      iat: now,
      exp: now + expiresIn,
      aud: 'https://appleid.apple.com',
      sub: clientId,
    },
    pem,
    {
      algorithm: 'ES256',
      header: { alg: 'ES256', kid: keyId },
    } as any,
  );
}

/**
 * Exchanges an Apple authorization code for tokens and extracts user info.
 * Returns the decoded ID token claims, which contain the user's `sub` and email.
 */
export async function exchangeAppleCode(code: string): Promise<{
  sub: string;
  email?: string;
}> {
  const clientId = process.env.APPLE_CLIENT_ID;
  const clientSecret = generateAppleClientSecret();
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8080';

  const params = new URLSearchParams({
    client_id: clientId!,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: `${backendUrl}/login/oauth2/code/apple`,
  });

  const response = await axios.post(
    'https://appleid.apple.com/auth/token',
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  const { id_token } = response.data as { id_token: string };
  // Decode without verifying (Apple's public key verification is optional for server-side flows)
  const decoded = jwt.decode(id_token) as { sub: string; email?: string };
  if (!decoded?.sub) throw new Error('Apple ID token is missing sub claim.');

  return decoded;
}
