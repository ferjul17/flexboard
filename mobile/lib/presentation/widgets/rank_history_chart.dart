import 'package:flutter/material.dart';

/// Model for rank history data point
class RankHistoryPoint {
  final DateTime timestamp;
  final int rank;
  final int totalFlexPoints;
  final int? rankChange;

  const RankHistoryPoint({
    required this.timestamp,
    required this.rank,
    required this.totalFlexPoints,
    this.rankChange,
  });

  factory RankHistoryPoint.fromJson(Map<String, dynamic> json) {
    return RankHistoryPoint(
      timestamp: DateTime.parse(json['recordedAt'] as String),
      rank: json['rank'] as int,
      totalFlexPoints: json['totalFlexPoints'] as int,
      rankChange: json['rankChange'] as int?,
    );
  }
}

/// Widget that displays rank history as a line chart
class RankHistoryChart extends StatelessWidget {
  final List<RankHistoryPoint> history;
  final String leaderboardType;

  const RankHistoryChart({
    super.key,
    required this.history,
    required this.leaderboardType,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (history.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.show_chart,
                size: 64,
                color: theme.colorScheme.outline,
              ),
              const SizedBox(height: 16),
              Text(
                'No history yet',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Your rank history will appear here',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.outline,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'Rank History - ${_formatLeaderboardType(leaderboardType)}',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ),

        // Simple chart visualization
        SizedBox(
          height: 200,
          child: _SimpleRankChart(history: history),
        ),

        const SizedBox(height: 16),

        // History list
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Recent Changes',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(height: 8),

        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: history.length > 10 ? 10 : history.length,
          itemBuilder: (context, index) {
            final point = history[index];
            return _HistoryListItem(point: point);
          },
        ),
      ],
    );
  }

  String _formatLeaderboardType(String type) {
    switch (type) {
      case 'global':
        return 'Global';
      case 'monthly':
        return 'Monthly';
      case 'weekly':
        return 'Weekly';
      case 'regional':
        return 'Regional';
      default:
        return type;
    }
  }
}

/// Simple rank chart visualization
class _SimpleRankChart extends StatelessWidget {
  final List<RankHistoryPoint> history;

  const _SimpleRankChart({required this.history});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final maxRank = history.map((p) => p.rank).reduce((a, b) => a > b ? a : b);
    final minRank = history.map((p) => p.rank).reduce((a, b) => a < b ? a : b);

    return CustomPaint(
      painter: _RankChartPainter(
        history: history,
        maxRank: maxRank,
        minRank: minRank,
        lineColor: theme.colorScheme.primary,
      ),
      child: Container(),
    );
  }
}

/// Custom painter for rank chart
class _RankChartPainter extends CustomPainter {
  final List<RankHistoryPoint> history;
  final int maxRank;
  final int minRank;
  final Color lineColor;

  _RankChartPainter({
    required this.history,
    required this.maxRank,
    required this.minRank,
    required this.lineColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (history.length < 2) return;

    final paint = Paint()
      ..color = lineColor
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    final path = Path();
    final rankRange = (maxRank - minRank).toDouble();

    for (var i = 0; i < history.length; i++) {
      final x = (i / (history.length - 1)) * size.width;
      // Note: Lower rank number is better, so we invert the Y axis
      final y = rankRange == 0
          ? size.height / 2
          : ((history[i].rank - minRank) / rankRange) * size.height;

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    canvas.drawPath(path, paint);

    // Draw points
    final pointPaint = Paint()
      ..color = lineColor
      ..style = PaintingStyle.fill;

    for (var i = 0; i < history.length; i++) {
      final x = (i / (history.length - 1)) * size.width;
      final y = rankRange == 0
          ? size.height / 2
          : ((history[i].rank - minRank) / rankRange) * size.height;
      canvas.drawCircle(Offset(x, y), 4, pointPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// History list item widget
class _HistoryListItem extends StatelessWidget {
  final RankHistoryPoint point;

  const _HistoryListItem({required this.point});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasChange = point.rankChange != null && point.rankChange != 0;
    final isImprovement = point.rankChange != null && point.rankChange! > 0;

    return ListTile(
      leading: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: theme.colorScheme.primaryContainer,
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Text(
            '#${point.rank}',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.onPrimaryContainer,
            ),
          ),
        ),
      ),
      title: Text(
        '${point.totalFlexPoints.toStringAsFixed(0)} points',
        style: theme.textTheme.bodyLarge,
      ),
      subtitle: Text(
        _formatTimestamp(point.timestamp),
        style: theme.textTheme.bodySmall?.copyWith(
          color: theme.colorScheme.onSurfaceVariant,
        ),
      ),
      trailing: hasChange
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isImprovement
                    ? Colors.green.withOpacity(0.1)
                    : Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isImprovement ? Icons.arrow_upward : Icons.arrow_downward,
                    size: 16,
                    color: isImprovement ? Colors.green : Colors.red,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${point.rankChange!.abs()}',
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: isImprovement ? Colors.green : Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            )
          : null,
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${timestamp.month}/${timestamp.day}/${timestamp.year}';
    }
  }
}
