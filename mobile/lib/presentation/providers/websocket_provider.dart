import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/services/websocket_service.dart';
import '../../data/models/rank_change_notification.dart';
import '../../core/constants/app_constants.dart';

/// WebSocket service provider
final websocketServiceProvider = Provider<WebSocketService>((ref) {
  final service = WebSocketService();

  // Auto-connect when provider is created
  service.connect(AppConstants.baseUrl);

  // Cleanup on dispose
  ref.onDispose(() {
    service.dispose();
  });

  return service;
});

/// WebSocket connection state provider
final websocketConnectionProvider = StreamProvider<bool>((ref) {
  final service = ref.watch(websocketServiceProvider);
  return service.connectionStream;
});

/// Rank change notification stream provider
final rankChangeNotificationProvider = StreamProvider<RankChangeNotification>((ref) {
  final service = ref.watch(websocketServiceProvider);
  return service.rankChangeStream;
});

/// Current WebSocket connection status
final isWebSocketConnectedProvider = Provider<bool>((ref) {
  final connectionState = ref.watch(websocketConnectionProvider);
  return connectionState.maybeWhen(
    data: (isConnected) => isConnected,
    orElse: () => false,
  );
});
