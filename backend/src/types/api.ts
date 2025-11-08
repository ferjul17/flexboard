// Common API response types

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalFlexPoints: number;
  totalSpent: number;
}

export interface Transaction {
  id: string;
  userId: string;
  packageId: string;
  amount: number;
  flexPoints: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  flexPoints: number;
  bonusPercentage: number;
  description: string;
}
