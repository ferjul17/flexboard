-- Flexboard Database Schema Migration 001
-- Initial schema setup for users, transactions, leaderboards, and achievements

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  region VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_region ON users(region);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 days'
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Packages table (Flex Points purchase packages)
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  flex_points INTEGER NOT NULL,
  bonus_percentage INTEGER DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_packages_is_active ON packages(is_active);

-- Insert default packages
INSERT INTO packages (name, price, flex_points, bonus_percentage, description) VALUES
  ('Bronze', 99.99, 100, 0, 'Entry-level package for newcomers'),
  ('Silver', 999.99, 1100, 10, 'Silver package with 10% bonus'),
  ('Gold', 9999.99, 12000, 20, 'Gold package with 20% bonus'),
  ('Platinum', 99999.99, 130000, 30, 'Platinum package with 30% bonus'),
  ('Diamond', 999999.99, 1400000, 40, 'Diamond package with 40% bonus');

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id),
  amount DECIMAL(12, 2) NOT NULL,
  flex_points INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_achievements_requirement_type ON achievements(requirement_type);

-- Insert default achievements
INSERT INTO achievements (name, description, requirement_type, requirement_value) VALUES
  ('First Purchase', 'Made your first purchase', 'first_purchase', 1),
  ('First Thousand', 'Reached 1,000 Flex Points', 'total_flex_points', 1000),
  ('First Million', 'Reached 1,000,000 Flex Points', 'total_flex_points', 1000000),
  ('Consistent Competitor', 'Maintained top-100 position for 30 consecutive days', 'consecutive_days_top_100', 30),
  ('Top 10', 'Reached top 10 on the global leaderboard', 'rank_achieved', 10),
  ('Diamond Tier', 'Purchased a Diamond package', 'package_purchased', 5);

-- User achievements table (many-to-many relationship)
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Leaderboard cache table (for performance optimization)
CREATE TABLE leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leaderboard_type VARCHAR(20) NOT NULL CHECK (leaderboard_type IN ('global', 'monthly', 'weekly', 'regional')),
  region VARCHAR(50),
  rank INTEGER NOT NULL,
  total_flex_points INTEGER NOT NULL,
  total_spent DECIMAL(12, 2) NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, leaderboard_type, region, period_start)
);

CREATE INDEX idx_leaderboard_cache_type ON leaderboard_cache(leaderboard_type);
CREATE INDEX idx_leaderboard_cache_rank ON leaderboard_cache(rank);
CREATE INDEX idx_leaderboard_cache_region ON leaderboard_cache(region);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for session management';
COMMENT ON TABLE packages IS 'Flex Points purchase packages';
COMMENT ON TABLE transactions IS 'Purchase transactions and Flex Points history';
COMMENT ON TABLE achievements IS 'Available achievements in the system';
COMMENT ON TABLE user_achievements IS 'Achievements unlocked by users';
COMMENT ON TABLE leaderboard_cache IS 'Cached leaderboard data for performance';
