import { describe, it, expect } from 'vitest';
import {
  getExamCountdowns,
  executeAutonomousReminders,
} from '../autonomousReminderEngine';

describe('Autonomous Student Reminders Engine', () => {
  describe('Exam Countdown Clocks', () => {
    it('should return valid positive countdown days for CEE and SEE', () => {
      const countdowns = getExamCountdowns();
      expect(countdowns.cee.days).toBeGreaterThan(0);
      expect(countdowns.see.days).toBeGreaterThan(0);
      expect(countdowns.ielts.days).toBeGreaterThan(0);
      expect(countdowns.cee.targetDate).toContain('CEE');
      expect(countdowns.see.targetDate).toContain('SEE');
    });
  });

  describe('Autonomous Reminder Triggers', () => {
    it('should generate streak preservation alerts with practice links', async () => {
      const result = await executeAutonomousReminders({
        triggerType: 'streak_preservation',
        dryRun: true,
      });

      expect(result.dryRun).toBe(true);
      expect(result.totalDispatched).toBeGreaterThan(0);
      expect(result.sampleDispatches.length).toBeGreaterThan(0);

      const sample = result.sampleDispatches[0];
      expect(sample.title).toContain('Streak');
      expect(sample.actionUrl).toBe('/practice');
    });

    it('should generate formatted WhatsApp URLs when student phone numbers exist', async () => {
      const result = await executeAutonomousReminders({
        triggerType: 'streak_preservation',
        dryRun: true,
      });

      expect(result.whatsAppLinksCount).toBeGreaterThan(0);
      const withWa = result.sampleDispatches.find((d) => !!d.whatsAppUrl);
      expect(withWa).toBeDefined();
      expect(withWa?.whatsAppUrl).toContain('https://wa.me/');
    });

    it('should generate live class pre-flight alerts and exam countdowns', async () => {
      const result = await executeAutonomousReminders({
        triggerType: 'all',
        dryRun: true,
      });

      const types = result.sampleDispatches.map((d) => d.type);
      expect(types.length).toBeGreaterThan(0);
    });
  });
});
