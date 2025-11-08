import { Context } from 'hono';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { sql } from '../config/database';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export async function register(c: Context) {
  const body = await c.req.json();
  const { email, username, password } = registerSchema.parse(body);

  // Check if user already exists
  const existingUser = await sql`
    SELECT id FROM users WHERE email = ${email} OR username = ${username}
  `;

  if (existingUser.length > 0) {
    throw new AppError(409, 'User already exists', 'USER_EXISTS');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const [user] = await sql`
    INSERT INTO users (email, username, password_hash)
    VALUES (${email}, ${username}, ${hashedPassword})
    RETURNING id, email, username, created_at
  `;

  // Generate tokens
  const accessToken = await generateAccessToken({
    userId: user.id,
    email: user.email,
  });

  const refreshToken = await generateRefreshToken({
    userId: user.id,
    email: user.email,
  });

  // Store refresh token in database
  await sql`
    INSERT INTO refresh_tokens (user_id, token)
    VALUES (${user.id}, ${refreshToken})
  `;

  return c.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.created_at,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  }, 201);
}

export async function login(c: Context) {
  const body = await c.req.json();
  const { email, password } = loginSchema.parse(body);

  // Find user
  const [user] = await sql`
    SELECT id, email, username, password_hash, created_at
    FROM users
    WHERE email = ${email}
  `;

  if (!user) {
    throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);

  if (!isValidPassword) {
    throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const accessToken = await generateAccessToken({
    userId: user.id,
    email: user.email,
  });

  const refreshToken = await generateRefreshToken({
    userId: user.id,
    email: user.email,
  });

  // Store refresh token in database
  await sql`
    INSERT INTO refresh_tokens (user_id, token)
    VALUES (${user.id}, ${refreshToken})
  `;

  return c.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.created_at,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  });
}

export async function refreshToken(c: Context) {
  const body = await c.req.json();
  const { refreshToken } = refreshTokenSchema.parse(body);

  try {
    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);

    // Check if refresh token exists in database
    const [tokenRecord] = await sql`
      SELECT id, user_id FROM refresh_tokens
      WHERE token = ${refreshToken} AND revoked = false
    `;

    if (!tokenRecord) {
      throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Get user
    const [user] = await sql`
      SELECT id, email FROM users WHERE id = ${tokenRecord.user_id}
    `;

    if (!user) {
      throw new AppError(401, 'User not found', 'USER_NOT_FOUND');
    }

    // Generate new tokens
    const newAccessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const newRefreshToken = await generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Revoke old refresh token and store new one
    await sql.begin(async (sql) => {
      await sql`
        UPDATE refresh_tokens SET revoked = true WHERE id = ${tokenRecord.id}
      `;
      await sql`
        INSERT INTO refresh_tokens (user_id, token)
        VALUES (${user.id}, ${newRefreshToken})
      `;
    });

    return c.json({
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      },
    });
  } catch (error) {
    throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }
}

export async function logout(c: Context) {
  const body = await c.req.json();
  const { refreshToken } = refreshTokenSchema.parse(body);

  // Revoke refresh token
  await sql`
    UPDATE refresh_tokens
    SET revoked = true
    WHERE token = ${refreshToken}
  `;

  return c.json({
    message: 'Logged out successfully',
  });
}
