-- Flexboard Database Schema Migration 002
-- Leaderboard position history tracking for Stage 3

-- Leaderboard position history table
-- Tracks rank changes over time for analytics and user engagement
CREATE TABLE leaderboard_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leaderboard_type VARCHAR(20) NOT NULL CHECK (leaderboard_type IN ('global', 'monthly', 'weekly', 'regional')),
  region VARCHAR(50),
  rank INTEGER NOT NULL,
  total_flex_points INTEGER NOT NULL,
  total_spent DECIMAL(12, 2) NOT NULL,
  rank_change INTEGER, -- Positive = moved up, negative = moved down, null = first entry
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_history_user_id ON leaderboard_history(user_id);
CREATE INDEX idx_leaderboard_history_type ON leaderboard_history(leaderboard_type);
CREATE INDEX idx_leaderboard_history_recorded_at ON leaderboard_history(recorded_at DESC);
CREATE INDEX idx_leaderboard_history_user_type ON leaderboard_history(user_id, leaderboard_type, recorded_at DESC);

-- Leaderboard snapshots table
-- Stores complete leaderboard state at specific intervals for historical analysis
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_type VARCHAR(20) NOT NULL CHECK (leaderboard_type IN ('global', 'monthly', 'weekly', 'regional')),
  region VARCHAR(50),
  snapshot_data JSONB NOT NULL, -- Stores top N users at that time
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_snapshots_type ON leaderboard_snapshots(leaderboard_type);
CREATE INDEX idx_leaderboard_snapshots_created_at ON leaderboard_snapshots(created_at DESC);
CREATE INDEX idx_leaderboard_snapshots_period ON leaderboard_snapshots(period_start, period_end);

-- Leaderboard reset history table
-- Tracks when monthly/weekly leaderboards were reset
CREATE TABLE leaderboard_resets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_type VARCHAR(20) NOT NULL CHECK (leaderboard_type IN ('monthly', 'weekly')),
  region VARCHAR(50),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  top_user_id UUID REFERENCES users(id),
  top_user_points INTEGER,
  total_participants INTEGER,
  reset_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_resets_type ON leaderboard_resets(leaderboard_type);
CREATE INDEX idx_leaderboard_resets_period ON leaderboard_resets(period_start, period_end);
CREATE INDEX idx_leaderboard_resets_reset_at ON leaderboard_resets(reset_at DESC);

-- Comments for documentation
COMMENT ON TABLE leaderboard_history IS 'Historical tracking of user rank changes over time';
COMMENT ON TABLE leaderboard_snapshots IS 'Periodic snapshots of complete leaderboard state';
COMMENT ON TABLE leaderboard_resets IS 'History of monthly and weekly leaderboard resets';
COMMENT ON COLUMN leaderboard_history.rank_change IS 'Change in rank from previous entry (positive = improvement, negative = decline)';
