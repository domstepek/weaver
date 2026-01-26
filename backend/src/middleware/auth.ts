import { and, eq, gt } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import { db, sessions, type User, users } from '../db/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const sessionId = req.cookies?.session;

  if (!sessionId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await db
      .select({
        session: sessions,
        user: users,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())),
      )
      .limit(1);

    if (result.length === 0) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.user = result[0].user;
    req.sessionId = sessionId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.session;

  if (!sessionId) {
    next();
    return;
  }

  db.select({
    session: sessions,
    user: users,
  })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1)
    .then((result) => {
      if (result.length > 0) {
        req.user = result[0].user;
        req.sessionId = sessionId;
      }
      next();
    })
    .catch((error) => {
      console.error('Optional auth middleware error:', error);
      next();
    });
}
