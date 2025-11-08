import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/app_constants.dart';

class ApiClient {
  static String get baseUrl => '${AppConstants.baseUrl}/api/${AppConstants.apiVersion}';
  static const String storageKeyAccessToken = 'access_token';
  static const String storageKeyRefreshToken = 'refresh_token';

  final Dio _dio;
  final FlutterSecureStorage _storage;

  ApiClient({Dio? dio, FlutterSecureStorage? storage})
      : _dio = dio ?? Dio(),
        _storage = storage ?? const FlutterSecureStorage() {
    _dio.options = BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: AppConstants.apiTimeout,
      receiveTimeout: AppConstants.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );

    // Add interceptor for authentication
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add access token to all requests
          final token = await getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Handle 401 errors by refreshing token
          if (error.response?.statusCode == 401) {
            final refreshToken = await getRefreshToken();
            if (refreshToken != null) {
              try {
                // Try to refresh the token
                final response = await _dio.post('/auth/refresh', data: {
                  'refreshToken': refreshToken,
                });

                if (response.statusCode == 200) {
                  final newAccessToken = response.data['data']['tokens']['accessToken'];
                  final newRefreshToken = response.data['data']['tokens']['refreshToken'];

                  await saveTokens(newAccessToken, newRefreshToken);

                  // Retry the original request
                  error.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
                  return handler.resolve(await _dio.fetch(error.requestOptions));
                }
              } catch (e) {
                // If refresh fails, clear tokens and redirect to login
                await clearTokens();
              }
            }
          }
          return handler.next(error);
        },
      ),
    );

    // Add logging interceptor in debug mode
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
    ));
  }

  // Token management
  Future<String?> getAccessToken() async {
    return await _storage.read(key: storageKeyAccessToken);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: storageKeyRefreshToken);
  }

  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _storage.write(key: storageKeyAccessToken, value: accessToken);
    await _storage.write(key: storageKeyRefreshToken, value: refreshToken);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: storageKeyAccessToken);
    await _storage.delete(key: storageKeyRefreshToken);
  }

  Future<bool> isAuthenticated() async {
    final token = await getAccessToken();
    return token != null;
  }

  // HTTP methods
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }
}
