import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/rank_change_notification.dart';

/// WebSocket service for real-time leaderboard updates
class WebSocketService {
  WebSocketChannel? _channel;
  final _storage = const FlutterSecureStorage();

  // Stream controllers for different notification types
  final _rankChangeController = StreamController<RankChangeNotification>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();

  String? _clientId;
  bool _isConnected = false;
  Timer? _reconnectTimer;
  Timer? _pingTimer;

  // Getters
  Stream<RankChangeNotification> get rankChangeStream => _rankChangeController.stream;
  Stream<bool> get connectionStream => _connectionController.stream;
  bool get isConnected => _isConnected;

  /// Connect to WebSocket server
  Future<void> connect(String baseUrl) async {
    try {
      // Get authentication token
      final token = await _storage.read(key: 'access_token');

      // Convert HTTP URL to WebSocket URL
      final wsUrl = baseUrl.replaceFirst('http://', 'ws://').replaceFirst('https://', 'wss://');
      final uri = Uri.parse('$wsUrl/ws/leaderboard${token != null ? '?token=$token' : ''}');

      print('🔌 Connecting to WebSocket: $uri');

      _channel = WebSocketChannel.connect(uri);

      // Listen to messages
      _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDisconnect,
      );

      // Start ping timer to keep connection alive
      _startPingTimer();

    } catch (e) {
      print('❌ WebSocket connection error: $e');
      _scheduleReconnect();
    }
  }

  /// Disconnect from WebSocket server
  void disconnect() {
    print('🔌 Disconnecting from WebSocket');
    _reconnectTimer?.cancel();
    _pingTimer?.cancel();
    _channel?.sink.close();
    _channel = null;
    _isConnected = false;
    _connectionController.add(false);
  }

  /// Subscribe to a specific leaderboard
  void subscribeToLeaderboard(String leaderboardType, {String? region}) {
    if (!_isConnected || _channel == null) {
      print('⚠️  Cannot subscribe: not connected');
      return;
    }

    final message = {
      'type': 'subscribe',
      'leaderboardType': leaderboardType,
      if (region != null) 'region': region,
    };

    _send(message);
    print('📊 Subscribed to $leaderboardType leaderboard${region != null ? ' ($region)' : ''}');
  }

  /// Unsubscribe from a specific leaderboard
  void unsubscribeFromLeaderboard(String leaderboardType, {String? region}) {
    if (!_isConnected || _channel == null) {
      return;
    }

    final message = {
      'type': 'unsubscribe',
      'leaderboardType': leaderboardType,
      if (region != null) 'region': region,
    };

    _send(message);
    print('📊 Unsubscribed from $leaderboardType leaderboard');
  }

  /// Send a message through WebSocket
  void _send(Map<String, dynamic> message) {
    try {
      _channel?.sink.add(json.encode(message));
    } catch (e) {
      print('❌ Error sending WebSocket message: $e');
    }
  }

  /// Handle incoming WebSocket messages
  void _handleMessage(dynamic data) {
    try {
      final message = json.decode(data.toString()) as Map<String, dynamic>;
      final type = message['type'] as String?;

      switch (type) {
        case 'connected':
          _clientId = message['clientId'] as String?;
          _isConnected = true;
          _connectionController.add(true);
          print('✅ WebSocket connected: $_clientId');
          break;

        case 'rank_change':
          final notification = RankChangeNotification.fromJson(message);
          _rankChangeController.add(notification);
          print('📢 Rank change: ${notification.userId} - ${notification.leaderboardType}');
          break;

        case 'leaderboard_update':
          // Handle general leaderboard update
          print('📢 Leaderboard update: ${message['leaderboardType']}');
          break;

        case 'subscribed':
          print('✅ Subscribed to ${message['leaderboardType']}');
          break;

        case 'unsubscribed':
          print('✅ Unsubscribed from ${message['leaderboardType']}');
          break;

        case 'pong':
          // Pong received - connection is alive
          break;

        case 'error':
          print('❌ WebSocket error: ${message['message']}');
          break;

        default:
          print('⚠️  Unknown message type: $type');
      }
    } catch (e) {
      print('❌ Error handling WebSocket message: $e');
    }
  }

  /// Handle WebSocket errors
  void _handleError(error) {
    print('❌ WebSocket error: $error');
    _isConnected = false;
    _connectionController.add(false);
    _scheduleReconnect();
  }

  /// Handle WebSocket disconnection
  void _handleDisconnect() {
    print('🔌 WebSocket disconnected');
    _isConnected = false;
    _connectionController.add(false);
    _pingTimer?.cancel();
    _scheduleReconnect();
  }

  /// Schedule automatic reconnection
  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () async {
      print('🔄 Attempting to reconnect WebSocket...');
      final baseUrl = await _storage.read(key: 'base_url') ?? 'http://localhost:3000';
      connect(baseUrl);
    });
  }

  /// Start ping timer to keep connection alive
  void _startPingTimer() {
    _pingTimer?.cancel();
    _pingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_isConnected && _channel != null) {
        _send({'type': 'ping'});
      }
    });
  }

  /// Dispose resources
  void dispose() {
    disconnect();
    _rankChangeController.close();
    _connectionController.close();
  }
}
