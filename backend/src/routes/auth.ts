import { Google } from 'arctic';
import { eq } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { generateCodeVerifier, generateState } from 'oslo/oauth2';
import { db, sessions, users } from '../db/index.js';

const router = Router();

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const googleRedirectUri =
  process.env.GOOGLE_REDIRECT_URI ||
  'http://localhost:3000/auth/google/callback';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const google = new Google(
  googleClientId,
  googleClientSecret,
  googleRedirectUri,
);

// Session duration: 30 days
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// Redirect to Google OAuth
router.get('/google', async (req: Request, res: Response) => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = google.createAuthorizationURL(state, codeVerifier, [
    'openid',
    'email',
    'profile',
  ]);

  // Store state and verifier in cookies for validation
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  res.cookie('oauth_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  res.redirect(url.toString());
});

// Handle OAuth callback
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;
  const storedState = req.cookies?.oauth_state;
  const codeVerifier = req.cookies?.oauth_code_verifier;

  // Clear OAuth cookies
  res.clearCookie('oauth_state');
  res.clearCookie('oauth_code_verifier');

  if (!code || !state || !storedState || !codeVerifier) {
    res.redirect(`${frontendUrl}/login?error=missing_params`);
    return;
  }

  if (state !== storedState) {
    res.redirect(`${frontendUrl}/login?error=invalid_state`);
    return;
  }

  try {
    // Exchange code for tokens
    const tokens = await google.validateAuthorizationCode(
      code as string,
      codeVerifier,
    );
    const accessToken = tokens.accessToken();

    // Fetch user info from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const googleUser = (await userInfoResponse.json()) as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    // Upsert user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleUser.id))
      .limit(1);

    let userId: string;

    if (existingUser.length > 0) {
      // Update existing user
      await db
        .update(users)
        .set({
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser[0].id));
      userId = existingUser[0].id;
    } else {
      // Create new user
      const newUser = await db
        .insert(users)
        .values({
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          googleId: googleUser.id,
        })
        .returning();
      userId = newUser[0].id;
    }

    // Create session
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const newSession = await db
      .insert(sessions)
      .values({
        userId,
        expiresAt,
      })
      .returning();

    // Set session cookie
    res.cookie('session', newSession[0].id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS,
    });

    res.redirect(frontendUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session;

  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    res.clearCookie('session');
  }

  res.json({ success: true });
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session;

  if (!sessionId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await db
      .select({
        user: users,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (result.length === 0) {
      res.clearCookie('session');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (session.length === 0 || session[0].expiresAt < new Date()) {
      res.clearCookie('session');
      res.status(401).json({ error: 'Session expired' });
      return;
    }

    const { googleId, ...userWithoutGoogleId } = result[0].user;
    res.json({ user: userWithoutGoogleId });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
