/**
 * Unit tests for SLA Service
 */

import { describe, it, expect } from 'vitest';
import { SLAService, SLAParameters } from '../../../src/services/sla.service';

describe('SLAService', () => {
  describe('calculateDueDates - 24/7 Mode', () => {
    it('should calculate due dates for 24/7 support', () => {
      const startTime = new Date('2025-11-05T10:00:00Z');
      const slaParams: SLAParameters = {
        response_time_hours: 2,
        resolution_time_hours: 8,
        business_hours_only: false,
      };

      const result = SLAService.calculateDueDates(startTime, slaParams);

      expect(result.response_due).toEqual(new Date('2025-11-05T12:00:00Z'));
      expect(result.resolution_due).toEqual(new Date('2025-11-05T18:00:00Z'));
    });

    it('should handle fractional hours in 24/7 mode', () => {
      const startTime = new Date('2025-11-05T10:00:00Z');
      const slaParams: SLAParameters = {
        response_time_hours: 0.5,
        resolution_time_hours: 2.5,
        business_hours_only: false,
      };

      const result = SLAService.calculateDueDates(startTime, slaParams);

      expect(result.response_due).toEqual(new Date('2025-11-05T10:30:00Z'));
      expect(result.resolution_due).toEqual(new Date('2025-11-05T12:30:00Z'));
    });

    it('should handle due dates spanning multiple days', () => {
      const startTime = new Date('2025-11-05T22:00:00Z');
      const slaParams: SLAParameters = {
        response_time_hours: 4,
        resolution_time_hours: 48,
        business_hours_only: false,
      };

      const result = SLAService.calculateDueDates(startTime, slaParams);

      expect(result.response_due).toEqual(new Date('2025-11-06T02:00:00Z'));
      expect(result.resolution_due).toEqual(new Date('2025-11-07T22:00:00Z'));
    });
  });

  describe('calculateDueDates - Business Hours Mode', () => {
    it('should calculate due dates within same business day', () => {
      // Tuesday 9:00 AM local time
      const startTime = new Date('2025-11-04T09:00:00');
      const slaParams: SLAParameters = {
        response_time_hours: 4,
        resolution_time_hours: 8,
        business_hours_only: true,
      };

      const result = SLAService.calculateDueDates(startTime, slaParams);

      // Response: 9:00 + 4 hours = 13:00 (1:00 PM)
      expect(result.response_due.getHours()).toBe(13);
      // Resolution: 9:00 + 8 hours = 17:00 (5:00 PM)
      expect(result.resolution_due.getHours()).toBe(17);
    });

    it('should skip to next business day if exceeding 18:00', () => {
      // Tuesday 16:00 (4:00 PM) + 4 hours should go to Wednesday
      const startTime = new Date('2025-11-04T16:00:00');
      const slaParams: SLAParameters = {
        response_time_hours: 4,
        resolution_time_hours: 8,
        business_hours_only: true,
      };

      const result = SLAService.calculateDueDates(startTime, slaParams);

      // Response: 16:00 + 2 hours to EOD (18:00), then +2 hours next day = 10:00 Wed
      expect(result.response_due.getDate()).toBe(5); // Next day
      expect(result.response_due.getHours()).toBe(10); // 10:00 AM

      // Resolution: 16:00 + 2 hours to EOD, then +6 hours next day = 14:00 Wed
      expect(result.resolution_due.getDate()).toBe(5);
      expect(result.resolution_due.getHours()).toBe(14); // 2:00 PM
    });

    it('should skip weekends (Friday to Monday)', () => {
      // Friday 16:00 + 6 hours should go to Monday
      const startTime = new Date('2025-11-07T16:00:00'); // Friday
      const slaParams: SLAParameters = {
        response_time_hours: 6,
        resolution_time_hours: 12,
        business_hours_only: true,
      };

      const result = SLAService.calculateDueDates(startTime, slaParams);

      // Response: Friday 16:00 + 2 hours to 18:00, then +4 hours Mon = 12:00 Mon
      expect(result.response_due.getDay()).toBe(1); // Monday
      expect(result.response_due.getHours()).toBe(12); // 12:00 PM

      // Resolution: Friday 16:00 + 12 hours total
      // Friday: 16:00 to 18:00 = 2 hours
      // Skip weekend
      // Monday: 8:00 + 10 remaining hours = 18:00
      expect(result.resolution_due.getDay()).toBe(1); // Monday
      expect(result.resolution_due.getHours()).toBe(18); // 18:00 (6:00 PM)
    });

    it('should handle start time before business hours', () => {
      // Tuesday 6:00 AM should jump to 8:00 AM
      const startTime = new Date('2025-11-04T06:00:00');
      const slaParams: SLAParameters = {
        response_time_hours: 2,
        resolution_time_hours: 4,
        business_hours_only: true,
      };

      const result = SLAService.calculateDueDates(startTime, slaParams);

      // Should start calculating from 8:00 AM
      // Response: 8:00 + 2 hours = 10:00
      expect(result.response_due.getHours()).toBe(10);
      // Resolution: 8:00 + 4 hours = 12:00
      expect(result.resolution_due.getHours()).toBe(12);
    });

    it('should handle start time after business hours', () => {
      // Tuesday 19:00 (after 18:00) should jump to Wednesday 8:00
      const startTime = new Date('2025-11-04T19:00:00');
      const slaParams: SLAParameters = {
        response_time_hours: 2,
        resolution_time_hours: 4,
        business_hours_only: true,
      };

      const result = SLAService.calculateDueDates(startTime, slaParams);

      // Should start from Wednesday 8:00
      expect(result.response_due.getDate()).toBe(5); // Wednesday
      expect(result.response_due.getHours()).toBe(10); // 8:00 + 2 hours
      expect(result.resolution_due.getHours()).toBe(12); // 8:00 + 4 hours
    });

    it('should handle weekend start times', () => {
      // Saturday should jump to Monday 8:00
      const startTime = new Date('2025-11-08T10:00:00'); // Saturday
      const slaParams: SLAParameters = {
        response_time_hours: 2,
        resolution_time_hours: 4,
        business_hours_only: true,
      };

      const result = SLAService.calculateDueDates(startTime, slaParams);

      // Should start from Monday 8:00
      expect(result.response_due.getDay()).toBe(1); // Monday
      expect(result.response_due.getHours()).toBe(10); // 8:00 + 2 hours
    });
  });

  describe('checkBreach', () => {
    it('should detect no breach when response and resolution are on time', () => {
      const responseDue = new Date('2025-11-05T12:00:00Z');
      const resolutionDue = new Date('2025-11-05T18:00:00Z');
      const firstResponseAt = new Date('2025-11-05T11:00:00Z');
      const resolvedAt = new Date('2025-11-05T17:00:00Z');
      const currentTime = new Date('2025-11-05T19:00:00Z');

      const result = SLAService.checkBreach(
        responseDue,
        resolutionDue,
        firstResponseAt,
        resolvedAt,
        currentTime
      );

      expect(result.is_breached).toBe(false);
      expect(result.breach_type).toBeUndefined();
    });

    it('should detect response SLA breach', () => {
      const responseDue = new Date('2025-11-05T12:00:00Z');
      const resolutionDue = new Date('2025-11-05T18:00:00Z');
      const firstResponseAt = new Date('2025-11-05T13:00:00Z'); // 1 hour late
      const resolvedAt = new Date('2025-11-05T17:00:00Z');

      const result = SLAService.checkBreach(
        responseDue,
        resolutionDue,
        firstResponseAt,
        resolvedAt
      );

      expect(result.is_breached).toBe(true);
      expect(result.breach_type).toBe('response');
      expect(result.breach_minutes).toBe(60); // 1 hour = 60 minutes
      expect(result.breach_reason).toContain('Response SLA breached by 60 minutes');
    });

    it('should detect resolution SLA breach', () => {
      const responseDue = new Date('2025-11-05T12:00:00Z');
      const resolutionDue = new Date('2025-11-05T18:00:00Z');
      const firstResponseAt = new Date('2025-11-05T11:00:00Z');
      const resolvedAt = new Date('2025-11-05T19:30:00Z'); // 90 minutes late

      const result = SLAService.checkBreach(
        responseDue,
        resolutionDue,
        firstResponseAt,
        resolvedAt
      );

      expect(result.is_breached).toBe(true);
      expect(result.breach_type).toBe('resolution');
      expect(result.breach_minutes).toBe(90);
      expect(result.breach_reason).toContain('Resolution SLA breached by 90 minutes');
    });

    it('should detect both response and resolution breaches', () => {
      const responseDue = new Date('2025-11-05T12:00:00Z');
      const resolutionDue = new Date('2025-11-05T18:00:00Z');
      const firstResponseAt = new Date('2025-11-05T14:00:00Z'); // 2 hours late
      const resolvedAt = new Date('2025-11-05T20:00:00Z'); // 2 hours late

      const result = SLAService.checkBreach(
        responseDue,
        resolutionDue,
        firstResponseAt,
        resolvedAt
      );

      expect(result.is_breached).toBe(true);
      expect(result.breach_type).toBe('both');
      expect(result.breach_minutes).toBe(120); // Max of both breaches
      expect(result.breach_reason).toContain('Response SLA');
      expect(result.breach_reason).toContain('Resolution SLA');
    });

    it('should detect ongoing response breach (no response yet)', () => {
      const responseDue = new Date('2025-11-05T12:00:00Z');
      const resolutionDue = new Date('2025-11-05T18:00:00Z');
      const firstResponseAt = null;
      const resolvedAt = null;
      const currentTime = new Date('2025-11-05T14:00:00Z'); // 2 hours after due

      const result = SLAService.checkBreach(
        responseDue,
        resolutionDue,
        firstResponseAt,
        resolvedAt,
        currentTime
      );

      expect(result.is_breached).toBe(true);
      expect(result.breach_type).toBe('response');
      expect(result.breach_minutes).toBe(120);
    });

    it('should detect ongoing resolution breach (not resolved yet)', () => {
      const responseDue = new Date('2025-11-05T12:00:00Z');
      const resolutionDue = new Date('2025-11-05T18:00:00Z');
      const firstResponseAt = new Date('2025-11-05T11:00:00Z'); // On time
      const resolvedAt = null;
      const currentTime = new Date('2025-11-05T19:00:00Z'); // 1 hour after due

      const result = SLAService.checkBreach(
        responseDue,
        resolutionDue,
        firstResponseAt,
        resolvedAt,
        currentTime
      );

      expect(result.is_breached).toBe(true);
      expect(result.breach_type).toBe('resolution');
      expect(result.breach_minutes).toBe(60);
    });

    it('should handle null SLA dates gracefully', () => {
      const result = SLAService.checkBreach(null, null);

      expect(result.is_breached).toBe(false);
      expect(result.breach_type).toBeUndefined();
    });
  });

  describe('isBusinessHours', () => {
    it('should return true for weekday business hours', () => {
      // Tuesday 10:00 AM
      const date = new Date('2025-11-04T10:00:00');
      expect(SLAService.isBusinessHours(date)).toBe(true);
    });

    it('should return false for weekday before business hours', () => {
      // Tuesday 7:00 AM
      const date = new Date('2025-11-04T07:00:00');
      expect(SLAService.isBusinessHours(date)).toBe(false);
    });

    it('should return false for weekday after business hours', () => {
      // Tuesday 19:00 (7:00 PM)
      const date = new Date('2025-11-04T19:00:00');
      expect(SLAService.isBusinessHours(date)).toBe(false);
    });

    it('should return false for Saturday', () => {
      // Saturday 10:00 AM
      const date = new Date('2025-11-08T10:00:00');
      expect(SLAService.isBusinessHours(date)).toBe(false);
    });

    it('should return false for Sunday', () => {
      // Sunday 10:00 AM
      const date = new Date('2025-11-09T10:00:00');
      expect(SLAService.isBusinessHours(date)).toBe(false);
    });

    it('should return true at business day start (8:00)', () => {
      // Tuesday 8:00 AM
      const date = new Date('2025-11-04T08:00:00');
      expect(SLAService.isBusinessHours(date)).toBe(true);
    });

    it('should return true just before business day end (17:59)', () => {
      // Tuesday 17:59 (5:59 PM) - still within business hours
      const date = new Date('2025-11-04T17:59:00');
      expect(SLAService.isBusinessHours(date)).toBe(true);
    });

    it('should return false at business day end (18:00)', () => {
      // Tuesday 18:00 (6:00 PM) - exactly at end, not within business hours
      const date = new Date('2025-11-04T18:00:00');
      expect(SLAService.isBusinessHours(date)).toBe(false);
    });
  });

  describe('calculateBusinessHoursBetween', () => {
    it('should calculate hours within same business day', () => {
      const start = new Date('2025-11-04T09:00:00'); // Tuesday 9:00 AM
      const end = new Date('2025-11-04T14:00:00'); // Tuesday 2:00 PM

      const hours = SLAService.calculateBusinessHoursBetween(start, end);
      expect(hours).toBe(5);
    });

    it('should return 0 for same time', () => {
      const date = new Date('2025-11-04T10:00:00');
      const hours = SLAService.calculateBusinessHoursBetween(date, date);
      expect(hours).toBe(0);
    });

    it('should return 0 when start is after end', () => {
      const start = new Date('2025-11-04T14:00:00');
      const end = new Date('2025-11-04T09:00:00');

      const hours = SLAService.calculateBusinessHoursBetween(start, end);
      expect(hours).toBe(0);
    });

    it('should skip non-business hours within same day', () => {
      const start = new Date('2025-11-04T06:00:00'); // 6:00 AM (before business)
      const end = new Date('2025-11-04T20:00:00'); // 8:00 PM (after business)

      // Should only count 8:00 - 18:00 = 10 hours
      const hours = SLAService.calculateBusinessHoursBetween(start, end);
      expect(hours).toBe(10);
    });

    it('should skip weekends', () => {
      const start = new Date('2025-11-07T14:00:00'); // Friday 2:00 PM
      const end = new Date('2025-11-10T10:00:00'); // Monday 10:00 AM

      // Friday: 14:00-18:00 = 4 hours
      // Saturday: 0 hours (weekend)
      // Sunday: 0 hours (weekend)
      // Monday: 8:00-10:00 = 2 hours
      // Total: 6 hours
      const hours = SLAService.calculateBusinessHoursBetween(start, end);
      expect(hours).toBe(6);
    });

    it('should handle partial hours', () => {
      const start = new Date('2025-11-04T09:00:00'); // 9:00 AM
      const end = new Date('2025-11-04T09:30:00'); // 9:30 AM

      const hours = SLAService.calculateBusinessHoursBetween(start, end);
      expect(hours).toBe(0.5);
    });
  });
});
