import { sql } from '../config/database';
import { hashPassword } from '../utils/password';

async function seedDatabase() {
  console.log('🌱 Seeding database...\n');

  try {
    // Create demo users
    console.log('Creating demo users...');

    const demoUsers = [
      { email: 'whale1@flexboard.com', username: 'DiamondWhale', password: 'password123' },
      { email: 'whale2@flexboard.com', username: 'GoldKing', password: 'password123' },
      { email: 'whale3@flexboard.com', username: 'PlatinumElite', password: 'password123' },
      { email: 'user1@flexboard.com', username: 'Competitor1', password: 'password123' },
      { email: 'user2@flexboard.com', username: 'Competitor2', password: 'password123' },
    ];

    const createdUsers = [];
    for (const user of demoUsers) {
      const passwordHash = await hashPassword(user.password);

      const [createdUser] = await sql`
        INSERT INTO users (email, username, password_hash, region)
        VALUES (${user.email}, ${user.username}, ${passwordHash}, 'US')
        ON CONFLICT (email) DO NOTHING
        RETURNING id, email, username
      `;

      if (createdUser) {
        createdUsers.push(createdUser);
        console.log(`  ✅ Created user: ${createdUser.username}`);
      }
    }

    // Create demo transactions
    if (createdUsers.length > 0) {
      console.log('\nCreating demo transactions...');

      // Get package IDs
      const packages = await sql`
        SELECT id, name, price, flex_points FROM packages ORDER BY price
      `;

      // Create various transactions for demo users
      const transactions = [
        { user: 0, packageName: 'Diamond', count: 3 },
        { user: 1, packageName: 'Platinum', count: 5 },
        { user: 2, packageName: 'Gold', count: 10 },
        { user: 3, packageName: 'Silver', count: 3 },
        { user: 4, packageName: 'Bronze', count: 2 },
      ];

      for (const txn of transactions) {
        if (createdUsers[txn.user]) {
          const pkg = packages.find((p: any) => p.name === txn.packageName);
          if (pkg) {
            for (let i = 0; i < txn.count; i++) {
              await sql`
                INSERT INTO transactions (user_id, package_id, amount, flex_points, status, payment_method)
                VALUES (
                  ${createdUsers[txn.user].id},
                  ${pkg.id},
                  ${pkg.price},
                  ${pkg.flex_points},
                  'completed',
                  'stripe'
                )
              `;
            }
            console.log(`  ✅ Created ${txn.count} ${txn.packageName} transactions for ${createdUsers[txn.user].username}`);
          }
        }
      }
    }

    console.log('\n✅ Database seeded successfully!\n');
    console.log('Demo credentials:');
    console.log('  Email: whale1@flexboard.com');
    console.log('  Password: password123\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

seedDatabase();
