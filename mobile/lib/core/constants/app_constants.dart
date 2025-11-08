/// Application-wide constants
class AppConstants {
  // API Configuration
  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'http://localhost:3000',
  );
  static const String apiVersion = 'v1';
  static const Duration apiTimeout = Duration(seconds: 30);

  // App Configuration
  static const String appName = 'Flexboard';
  static const String appVersion = '0.1.0';

  // Storage Keys
  static const String authTokenKey = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userIdKey = 'user_id';

  // Pagination
  static const int defaultPageSize = 20;
  static const int leaderboardPageSize = 50;

  // Private constructor to prevent instantiation
  AppConstants._();
}

/// API endpoint paths
class ApiEndpoints {
  // Authentication
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';

  // User
  static const String profile = '/user/profile';
  static const String updateProfile = '/user/profile';

  // Leaderboard
  static const String globalLeaderboard = '/leaderboard/global';
  static const String monthlyLeaderboard = '/leaderboard/monthly';
  static const String weeklyLeaderboard = '/leaderboard/weekly';
  static const String regionalLeaderboard = '/leaderboard/regional';

  // Shop
  static const String packages = '/shop/packages';
  static const String purchase = '/shop/purchase';
  static const String transactions = '/shop/transactions';

  // Private constructor to prevent instantiation
  ApiEndpoints._();
}
