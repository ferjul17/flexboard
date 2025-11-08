import { Context, Next } from 'hono';
import { jwtVerify } from 'jose';
import { env } from '../config/env';
import { AppError } from './errorHandler';

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'No token provided', 'NO_TOKEN');
  }

  const token = authHeader.substring(7);

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Store user info in context
    c.set('user', {
      userId: payload.userId as string,
      email: payload.email as string,
    });

    await next();
  } catch (error) {
    throw new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');
  }
}

export function getUser(c: Context): { userId: string; email: string } {
  const user = c.get('user');
  if (!user) {
    throw new AppError(401, 'User not authenticated', 'NOT_AUTHENTICATED');
  }
  return user;
}
