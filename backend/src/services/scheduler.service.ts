/**
 * Scheduler service for periodic tasks
 * Handles automatic leaderboard resets and snapshots
 */

import { resetMonthlyLeaderboard, resetWeeklyLeaderboard, createLeaderboardSnapshot } from './leaderboard.service';

class SchedulerService {
  private intervals: Map<string, Timer> = new Map();

  /**
   * Start all scheduled tasks
   */
  start() {
    console.log('🚀 Starting scheduler service...');

    // Schedule monthly leaderboard reset (runs on the 1st of each month at midnight)
    this.scheduleMonthlyReset();

    // Schedule weekly leaderboard reset (runs every Monday at midnight)
    this.scheduleWeeklyReset();

    // Schedule hourly snapshots for active leaderboards
    this.scheduleHourlySnapshots();

    console.log('✅ Scheduler service started');
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    console.log('🛑 Stopping scheduler service...');
    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
      console.log(`  ✓ Stopped ${name}`);
    });
    this.intervals.clear();
    console.log('✅ Scheduler service stopped');
  }

  /**
   * Schedule monthly leaderboard reset
   * Runs on the 1st of each month at midnight UTC
   */
  private scheduleMonthlyReset() {
    const checkAndReset = async () => {
      const now = new Date();

      // Check if it's the 1st of the month and between midnight and 1 AM
      if (now.getUTCDate() === 1 && now.getUTCHours() === 0) {
        console.log('📅 Monthly reset triggered');
        try {
          await resetMonthlyLeaderboard();
          // TODO: Reset for each region if regional leaderboards are used
        } catch (error) {
          console.error('❌ Monthly reset failed:', error);
        }
      }
    };

    // Check every hour
    const interval = setInterval(checkAndReset, 60 * 60 * 1000);
    this.intervals.set('monthly-reset', interval);

    // Run immediately if it's the 1st and we just started
    checkAndReset();
  }

  /**
   * Schedule weekly leaderboard reset
   * Runs every Monday at midnight UTC
   */
  private scheduleWeeklyReset() {
    const checkAndReset = async () => {
      const now = new Date();

      // Check if it's Monday (1) and between midnight and 1 AM
      if (now.getUTCDay() === 1 && now.getUTCHours() === 0) {
        console.log('📅 Weekly reset triggered');
        try {
          await resetWeeklyLeaderboard();
          // TODO: Reset for each region if regional leaderboards are used
        } catch (error) {
          console.error('❌ Weekly reset failed:', error);
        }
      }
    };

    // Check every hour
    const interval = setInterval(checkAndReset, 60 * 60 * 1000);
    this.intervals.set('weekly-reset', interval);

    // Run immediately if it's Monday and we just started
    checkAndReset();
  }

  /**
   * Schedule hourly snapshots of leaderboards
   * Creates snapshots every hour for historical tracking
   */
  private scheduleHourlySnapshots() {
    const createSnapshots = async () => {
      try {
        console.log('📸 Creating leaderboard snapshots...');

        // Create snapshots for different leaderboard types
        await Promise.all([
          createLeaderboardSnapshot('global', undefined, 100),
          createLeaderboardSnapshot('monthly', undefined, 100),
          createLeaderboardSnapshot('weekly', undefined, 100),
        ]);

        console.log('✅ Snapshots created successfully');
      } catch (error) {
        console.error('❌ Snapshot creation failed:', error);
      }
    };

    // Run every hour
    const interval = setInterval(createSnapshots, 60 * 60 * 1000);
    this.intervals.set('hourly-snapshots', interval);

    // Run once at startup
    createSnapshots();
  }

  /**
   * Manually trigger monthly reset (for testing)
   */
  async triggerMonthlyReset(region?: string) {
    console.log('🔧 Manual monthly reset triggered');
    return await resetMonthlyLeaderboard(region);
  }

  /**
   * Manually trigger weekly reset (for testing)
   */
  async triggerWeeklyReset(region?: string) {
    console.log('🔧 Manual weekly reset triggered');
    return await resetWeeklyLeaderboard(region);
  }
}

// Export singleton instance
export const scheduler = new SchedulerService();
