// Database row types (snake_case as returned from postgres)

export interface LeaderboardRow {
  rank: string;
  user_id: string;
  username: string;
  total_flex_points: string;
  total_spent: string;
}

export interface PackageRow {
  id: string;
  name: string;
  price: string;
  flex_points: string;
  bonus_percentage: string;
  description: string;
  is_active: boolean;
  created_at: Date;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  package_id: string;
  package_name: string;
  amount: string;
  flex_points: string;
  bonus_percentage: string;
  status: string;
  payment_method: string;
  payment_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface StripeEventRow {
  id: string;
  event_id: string;
  event_type: string;
  processed_at: Date;
}

export interface CountRow {
  count: string;
}

export interface WebSocketMessageData {
  leaderboard?: unknown;
  user?: unknown;
  message?: string;
  [key: string]: unknown;
}

export interface LeaderboardHistoryRow {
  rank: string;
  total_flex_points: string;
  total_spent: string;
  rank_change: string | null;
  recorded_at: Date;
}
