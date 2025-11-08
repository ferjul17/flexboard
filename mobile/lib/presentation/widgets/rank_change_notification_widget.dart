import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/rank_change_notification.dart';
import '../providers/websocket_provider.dart';

/// Widget that displays rank change notifications
/// Shows an animated overlay when the user's rank changes
class RankChangeNotificationWidget extends ConsumerStatefulWidget {
  final Widget child;

  const RankChangeNotificationWidget({
    super.key,
    required this.child,
  });

  @override
  ConsumerState<RankChangeNotificationWidget> createState() =>
      _RankChangeNotificationWidgetState();
}

class _RankChangeNotificationWidgetState
    extends ConsumerState<RankChangeNotificationWidget>
    with SingleTickerProviderStateMixin {
  final List<RankChangeNotification> _notifications = [];
  final Duration _displayDuration = const Duration(seconds: 4);

  @override
  Widget build(BuildContext context) {
    // Listen to rank change notifications
    ref.listen<AsyncValue<RankChangeNotification>>(
      rankChangeNotificationProvider,
      (previous, next) {
        next.whenData((notification) {
          setState(() {
            _notifications.add(notification);
          });

          // Auto-remove after display duration
          Future.delayed(_displayDuration, () {
            if (mounted) {
              setState(() {
                _notifications.remove(notification);
              });
            }
          });
        });
      },
    );

    return Stack(
      children: [
        widget.child,
        // Notification overlays
        Positioned(
          top: MediaQuery.of(context).padding.top + 16,
          left: 16,
          right: 16,
          child: Column(
            children: _notifications
                .map((notification) => _RankChangeCard(
                      notification: notification,
                      onDismiss: () {
                        setState(() {
                          _notifications.remove(notification);
                        });
                      },
                    ))
                .toList(),
          ),
        ),
      ],
    );
  }
}

/// Individual rank change notification card
class _RankChangeCard extends StatefulWidget {
  final RankChangeNotification notification;
  final VoidCallback onDismiss;

  const _RankChangeCard({
    required this.notification,
    required this.onDismiss,
  });

  @override
  State<_RankChangeCard> createState() => _RankChangeCardState();
}

class _RankChangeCardState extends State<_RankChangeCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isImprovement = widget.notification.isImprovement;

    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: Dismissible(
          key: Key(widget.notification.timestamp.toIso8601String()),
          direction: DismissDirection.horizontal,
          onDismissed: (_) => widget.onDismiss(),
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isImprovement
                  ? Colors.green.withOpacity(0.95)
                  : Colors.orange.withOpacity(0.95),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                // Icon
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isImprovement ? Icons.trending_up : Icons.trending_down,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),

                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isImprovement ? 'Rank Improved! 🎉' : 'Rank Changed',
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'You moved ${isImprovement ? 'up' : 'down'} to rank #${widget.notification.newRank}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withOpacity(0.9),
                        ),
                      ),
                      if (widget.notification.oldRank != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Previous: #${widget.notification.oldRank}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.white.withOpacity(0.7),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                // Rank change badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    widget.notification.rankChangeDescription,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
