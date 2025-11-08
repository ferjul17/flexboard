import { Context } from 'hono';
import { sql } from '../config/database';

/**
 * Get all available packages
 */
export async function getPackages(c: Context) {
  const packages = await sql`
    SELECT
      id,
      name,
      price,
      flex_points,
      bonus_percentage,
      description,
      is_active,
      created_at
    FROM packages
    WHERE is_active = true
    ORDER BY price ASC
  `;

  return c.json({
    data: packages.map((pkg: any) => ({
      id: pkg.id,
      name: pkg.name,
      price: parseFloat(pkg.price),
      flexPoints: pkg.flex_points,
      bonusPercentage: pkg.bonus_percentage,
      description: pkg.description,
      isActive: pkg.is_active,
      createdAt: pkg.created_at,
    })),
  });
}

/**
 * Get a single package by ID
 */
export async function getPackageById(c: Context) {
  const { id } = c.req.param();

  const [pkg] = await sql`
    SELECT
      id,
      name,
      price,
      flex_points,
      bonus_percentage,
      description,
      is_active,
      created_at
    FROM packages
    WHERE id = ${id} AND is_active = true
  `;

  if (!pkg) {
    return c.json({ error: 'Package not found' }, 404);
  }

  return c.json({
    data: {
      id: pkg.id,
      name: pkg.name,
      price: parseFloat(pkg.price),
      flexPoints: pkg.flex_points,
      bonusPercentage: pkg.bonus_percentage,
      description: pkg.description,
      isActive: pkg.is_active,
      createdAt: pkg.created_at,
    },
  });
}
