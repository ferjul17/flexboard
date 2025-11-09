import type { Context } from 'hono';
import { z } from 'zod';
import { getUser } from '../middleware/auth';
import { sanitizeUsername } from '../utils/sanitize';
import { AppError } from '../middleware/errorHandler';
import { sql } from '../config/database';

const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).transform(sanitizeUsername).optional(),
});

export async function getProfile(c: Context) {
  const { userId } = getUser(c);

  const [user] = await sql`
    SELECT
      u.id,
      u.email,
      u.username,
      u.created_at,
      u.updated_at,
      COALESCE(SUM(t.flex_points), 0) as total_flex_points,
      COALESCE(SUM(t.amount), 0) as total_spent
    FROM users u
    LEFT JOIN transactions t ON u.id = t.user_id AND t.status = 'completed'
    WHERE u.id = ${userId}
    GROUP BY u.id
  `;

  if (!user) {
    throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
  }

  // Get user rank
  const [rankData] = await sql`
    WITH user_totals AS (
      SELECT
        user_id,
        SUM(flex_points) as total_flex_points
      FROM transactions
      WHERE status = 'completed'
      GROUP BY user_id
    ),
    ranked_users AS (
      SELECT
        user_id,
        total_flex_points,
        ROW_NUMBER() OVER (ORDER BY total_flex_points DESC) as rank
      FROM user_totals
    )
    SELECT rank FROM ranked_users WHERE user_id = ${userId}
  `;

  return c.json({
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      totalFlexPoints: parseInt(user.total_flex_points),
      totalSpent: parseFloat(user.total_spent),
      rank: rankData?.rank || null,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
  });
}

export async function updateProfile(c: Context) {
  const { userId } = getUser(c);
  const body = await c.req.json();
  const { username } = updateProfileSchema.parse(body);

  if (!username) {
    throw new AppError(400, 'No update data provided', 'NO_UPDATE_DATA');
  }

  // Check if username is already taken
  const existingUser = await sql`
    SELECT id FROM users WHERE username = ${username} AND id != ${userId}
  `;

  if (existingUser.length > 0) {
    throw new AppError(409, 'Username already taken', 'USERNAME_TAKEN');
  }

  // Update user
  const [updatedUser] = await sql`
    UPDATE users
    SET username = ${username}, updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, email, username, updated_at
  `;

  return c.json({
    data: updatedUser,
  });
}
