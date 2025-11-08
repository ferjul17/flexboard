import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
}

export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);

  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

export async function generateRefreshToken(payload: TokenPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as TokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as TokenPayload;
}
