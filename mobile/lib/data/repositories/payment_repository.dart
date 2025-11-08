import 'package:dio/dio.dart';
import '../services/api_client.dart';

class PaymentRepository {
  final ApiClient _apiClient;

  PaymentRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  /// Get Stripe configuration
  Future<String> getStripePublishableKey() async {
    try {
      final response = await _apiClient.get('/payment/config');
      return response.data['data']['publishableKey'];
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Create checkout session
  Future<Map<String, dynamic>> createCheckout(String packageId) async {
    try {
      final response = await _apiClient.post(
        '/payment/checkout',
        data: {'packageId': packageId},
      );
      return response.data['data'];
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Create payment intent
  Future<Map<String, dynamic>> createPaymentIntent(String packageId) async {
    try {
      final response = await _apiClient.post(
        '/payment/payment-intent',
        data: {'packageId': packageId},
      );
      return response.data['data'];
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Verify payment
  Future<Map<String, dynamic>> verifyPayment(String transactionId) async {
    try {
      final response = await _apiClient.get('/payment/verify/$transactionId');
      return response.data['data'];
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException error) {
    if (error.response?.data != null) {
      final message = error.response?.data['error'] ?? error.response?.data['message'];
      return message ?? 'An error occurred';
    }
    return 'Network error. Please check your connection.';
  }
}
