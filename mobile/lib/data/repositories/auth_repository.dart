import 'package:dio/dio.dart';
import '../models/user_model.dart';
import '../services/api_client.dart';

class AuthRepository {
  final ApiClient _apiClient;

  AuthRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  /// Register a new user
  Future<AuthResponse> register({
    required String email,
    required String username,
    required String password,
  }) async {
    try {
      final response = await _apiClient.post(
        '/auth/register',
        data: {
          'email': email,
          'username': username,
          'password': password,
        },
      );

      final authResponse = AuthResponse.fromJson(response.data['data']);

      // Save tokens
      await _apiClient.saveTokens(
        authResponse.tokens.accessToken,
        authResponse.tokens.refreshToken,
      );

      return authResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Login with email and password
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiClient.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      final authResponse = AuthResponse.fromJson(response.data['data']);

      // Save tokens
      await _apiClient.saveTokens(
        authResponse.tokens.accessToken,
        authResponse.tokens.refreshToken,
      );

      return authResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      final refreshToken = await _apiClient.getRefreshToken();
      if (refreshToken != null) {
        await _apiClient.post(
          '/auth/logout',
          data: {'refreshToken': refreshToken},
        );
      }
    } catch (e) {
      // Ignore logout errors
    } finally {
      await _apiClient.clearTokens();
    }
  }

  /// Check if user is authenticated
  Future<bool> isAuthenticated() async {
    return await _apiClient.isAuthenticated();
  }

  String _handleError(DioException error) {
    if (error.response?.data != null) {
      final message = error.response?.data['error'] ?? error.response?.data['message'];
      return message ?? 'An error occurred';
    }
    return 'Network error. Please check your connection.';
  }
}
