import passport from 'passport';

// ─── OAuth2 (Google / Microsoft / Apple) — désactivé temporairement ──────────
// Pour réactiver, décommenter les imports et les blocs de stratégie ci-dessous.
//
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Strategy as OAuth2Strategy } from 'passport-oauth2';
// import jwt from 'jsonwebtoken';
// import axios from 'axios';
// import { authService } from '../services/auth.service';
// import { OAuthUserProfile } from '../types';
//
// const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';
//
// ── Google ────────────────────────────────────────────────────────────────────
// const googleClientId = process.env.GOOGLE_CLIENT_ID;
// const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
// if (googleClientId && googleClientSecret) {
//   passport.use('google', new GoogleStrategy({ ... }, async (...) => { ... }));
// }
//
// ── Microsoft ─────────────────────────────────────────────────────────────────
// const msClientId = process.env.MICROSOFT_CLIENT_ID;
// const msClientSecret = process.env.MICROSOFT_CLIENT_SECRET;
// if (msClientId && msClientSecret) {
//   passport.use('microsoft', new OAuth2Strategy({ ... }, (...) => { ... }));
// }
//
// ── Apple helpers ─────────────────────────────────────────────────────────────
// export function generateAppleClientSecret(): string { ... }
// export async function exchangeAppleCode(code: string): Promise<...> { ... }

// ─── Session stubs (we use JWT, not sessions) ─────────────────────────────────

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => done(null, { id }));

export default passport;

// Dummy exports so that any future re-activation of OAuth routes doesn't require
// changing the import lines — just uncomment the implementations above.
export function generateAppleClientSecret(): never {
  throw new Error('Apple OAuth2 is disabled. Configure APPLE_* env vars and uncomment the implementation in passport.ts.');
}
export async function exchangeAppleCode(_code: string): Promise<never> {
  throw new Error('Apple OAuth2 is disabled. Configure APPLE_* env vars and uncomment the implementation in passport.ts.');
}
