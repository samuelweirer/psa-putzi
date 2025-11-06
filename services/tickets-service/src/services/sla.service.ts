/**
 * SLA Calculation Service
 *
 * Handles SLA due date calculations with support for:
 * - Business hours (Mon-Fri 8:00-18:00 CET/CEST)
 * - 24/7 support
 * - SLA breach detection
 * - Holiday support (optional)
 */

import logger from '../utils/logger';

export interface SLAParameters {
  response_time_hours: number;
  resolution_time_hours: number;
  business_hours_only: boolean;
  timezone?: string; // Default: 'Europe/Berlin' (CET/CEST)
}

export interface SLADueDates {
  response_due: Date;
  resolution_due: Date;
}

export interface SLABreachInfo {
  is_breached: boolean;
  breach_type?: 'response' | 'resolution' | 'both';
  breach_minutes?: number;
  breach_reason?: string;
}

export class SLAService {
  /**
   * Business hours configuration
   * Default: Monday-Friday 8:00-18:00 (10 hours per day)
   */
  private static readonly BUSINESS_START_HOUR = 8;
  private static readonly BUSINESS_END_HOUR = 18;

  /**
   * Calculate SLA due dates from a start time
   *
   * @param startTime - When the SLA clock starts (e.g., ticket creation time)
   * @param slaParams - SLA parameters (response/resolution times, business hours mode)
   * @returns Object with response_due and resolution_due timestamps
   */
  static calculateDueDates(
    startTime: Date,
    slaParams: SLAParameters
  ): SLADueDates {
    logger.debug('Calculating SLA due dates', {
      startTime,
      slaParams,
    });

    if (slaParams.business_hours_only) {
      return {
        response_due: this.addBusinessHours(
          startTime,
          slaParams.response_time_hours
        ),
        resolution_due: this.addBusinessHours(
          startTime,
          slaParams.resolution_time_hours
        ),
      };
    } else {
      // 24/7 support - simple addition
      return {
        response_due: new Date(
          startTime.getTime() + slaParams.response_time_hours * 3600 * 1000
        ),
        resolution_due: new Date(
          startTime.getTime() + slaParams.resolution_time_hours * 3600 * 1000
        ),
      };
    }
  }

  /**
   * Add business hours to a date, skipping weekends and non-business hours
   *
   * Business hours: Mon-Fri 8:00-18:00 (10 hours per day)
   * Weekends: Saturday (6), Sunday (0)
   *
   * @param startDate - Starting date/time
   * @param hours - Number of business hours to add
   * @returns New date with business hours added
   */
  static addBusinessHours(startDate: Date, hours: number): Date {
    let remainingHours = hours;
    let currentDate = new Date(startDate);

    logger.debug('Adding business hours', {
      startDate,
      hoursToAdd: hours,
    });

    while (remainingHours > 0) {
      const dayOfWeek = currentDate.getDay();
      const hour = currentDate.getHours();
      const minute = currentDate.getMinutes();

      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Move to next Monday at 8:00
        const daysToAdd = dayOfWeek === 0 ? 1 : 2; // Sunday -> +1, Saturday -> +2
        currentDate.setDate(currentDate.getDate() + daysToAdd);
        currentDate.setHours(this.BUSINESS_START_HOUR, 0, 0, 0);
        continue;
      }

      // If before business hours, jump to 8:00
      if (hour < this.BUSINESS_START_HOUR) {
        currentDate.setHours(this.BUSINESS_START_HOUR, 0, 0, 0);
        continue;
      }

      // If after business hours, jump to next day at 8:00
      if (hour >= this.BUSINESS_END_HOUR) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(this.BUSINESS_START_HOUR, 0, 0, 0);
        continue;
      }

      // Calculate how many hours we can add before end of business day
      const currentTimeInMinutes = hour * 60 + minute;
      const endOfDayInMinutes = this.BUSINESS_END_HOUR * 60;
      const availableMinutes = endOfDayInMinutes - currentTimeInMinutes;
      const availableHours = availableMinutes / 60;

      // Add as many hours as possible within the current business day
      const hoursToAdd = Math.min(remainingHours, availableHours);
      currentDate.setTime(currentDate.getTime() + hoursToAdd * 3600 * 1000);
      remainingHours -= hoursToAdd;

      // If we still have remaining hours after adding to current day,
      // we need to move to the next business day
      if (remainingHours > 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(this.BUSINESS_START_HOUR, 0, 0, 0);
      }
    }

    logger.debug('Business hours calculation complete', {
      startDate,
      resultDate: currentDate,
      hoursAdded: hours,
    });

    return currentDate;
  }

  /**
   * Check if SLA is breached
   *
   * @param responseDue - Response due date
   * @param resolutionDue - Resolution due date
   * @param firstResponseAt - When first response was provided (optional)
   * @param resolvedAt - When ticket was resolved (optional)
   * @param currentTime - Current time (default: now)
   * @returns Object with breach information
   */
  static checkBreach(
    responseDue: Date | null,
    resolutionDue: Date | null,
    firstResponseAt?: Date | null,
    resolvedAt?: Date | null,
    currentTime: Date = new Date()
  ): SLABreachInfo {
    let isBreached = false;
    let breachType: 'response' | 'resolution' | 'both' | undefined;
    let breachMinutes = 0;
    const breachReasons: string[] = [];

    // Check response SLA
    if (responseDue && !firstResponseAt) {
      // No response yet - check if overdue
      if (currentTime > responseDue) {
        isBreached = true;
        breachType = 'response';
        const responseBreachMs = currentTime.getTime() - responseDue.getTime();
        breachMinutes = Math.floor(responseBreachMs / 60000);
        breachReasons.push(
          `Response SLA breached by ${breachMinutes} minutes`
        );
      }
    } else if (responseDue && firstResponseAt && firstResponseAt > responseDue) {
      // Response was provided late
      isBreached = true;
      breachType = 'response';
      const responseBreachMs = firstResponseAt.getTime() - responseDue.getTime();
      breachMinutes = Math.floor(responseBreachMs / 60000);
      breachReasons.push(`Response SLA breached by ${breachMinutes} minutes`);
    }

    // Check resolution SLA
    if (resolutionDue && !resolvedAt) {
      // Not resolved yet - check if overdue
      if (currentTime > resolutionDue) {
        const resolutionBreachMs =
          currentTime.getTime() - resolutionDue.getTime();
        const resolutionBreachMinutes = Math.floor(resolutionBreachMs / 60000);

        if (isBreached) {
          breachType = 'both';
          breachMinutes = Math.max(breachMinutes, resolutionBreachMinutes);
        } else {
          isBreached = true;
          breachType = 'resolution';
          breachMinutes = resolutionBreachMinutes;
        }
        breachReasons.push(
          `Resolution SLA breached by ${resolutionBreachMinutes} minutes`
        );
      }
    } else if (resolutionDue && resolvedAt && resolvedAt > resolutionDue) {
      // Resolved late
      const resolutionBreachMs = resolvedAt.getTime() - resolutionDue.getTime();
      const resolutionBreachMinutes = Math.floor(resolutionBreachMs / 60000);

      if (isBreached) {
        breachType = 'both';
        breachMinutes = Math.max(breachMinutes, resolutionBreachMinutes);
      } else {
        isBreached = true;
        breachType = 'resolution';
        breachMinutes = resolutionBreachMinutes;
      }
      breachReasons.push(
        `Resolution SLA breached by ${resolutionBreachMinutes} minutes`
      );
    }

    return {
      is_breached: isBreached,
      breach_type: breachType,
      breach_minutes: breachMinutes,
      breach_reason: breachReasons.length > 0 ? breachReasons.join('; ') : undefined,
    };
  }

  /**
   * Calculate business hours between two dates
   *
   * Useful for reporting and analytics
   *
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Number of business hours between the dates
   */
  static calculateBusinessHoursBetween(
    startDate: Date,
    endDate: Date
  ): number {
    if (startDate >= endDate) {
      return 0;
    }

    let totalHours = 0;
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      const dayOfWeek = currentDate.getDay();
      const hour = currentDate.getHours();

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(this.BUSINESS_START_HOUR, 0, 0, 0);
        continue;
      }

      // Skip non-business hours
      if (hour < this.BUSINESS_START_HOUR) {
        currentDate.setHours(this.BUSINESS_START_HOUR, 0, 0, 0);
        continue;
      }

      if (hour >= this.BUSINESS_END_HOUR) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(this.BUSINESS_START_HOUR, 0, 0, 0);
        continue;
      }

      // Add one hour
      const nextHour = new Date(currentDate.getTime() + 3600 * 1000);
      if (nextHour <= endDate) {
        totalHours += 1;
        currentDate = nextHour;
      } else {
        // Partial hour
        const remainingMs = endDate.getTime() - currentDate.getTime();
        totalHours += remainingMs / 3600000;
        break;
      }
    }

    return totalHours;
  }

  /**
   * Check if a given date/time is within business hours
   *
   * @param date - Date to check
   * @returns True if within business hours (Mon-Fri 8:00-18:00)
   */
  static isBusinessHours(date: Date): boolean {
    const dayOfWeek = date.getDay();
    const hour = date.getHours();

    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // Business hours check
    return hour >= this.BUSINESS_START_HOUR && hour < this.BUSINESS_END_HOUR;
  }
}
