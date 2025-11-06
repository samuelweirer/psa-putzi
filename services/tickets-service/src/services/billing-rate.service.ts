/**
 * Billing Rate Resolution Service
 *
 * Implements the 4-level billing rate hierarchy:
 * 1. user_billing_rates (most specific match)
 * 2. contracts.hourly_rate (contract default)
 * 3. users.default_billing_rate (user default)
 * 4. ERROR if no rate found
 *
 * CRITICAL: This service implements the snapshot pattern - rates are resolved
 * at time of entry creation and stored in time_entries table.
 */

import { query } from '../utils/database';
import { ResolvedRates } from '../types';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export class BillingRateService {
  /**
   * Resolve billing and cost rates for a time entry
   *
   * @param userId - User creating the time entry
   * @param customerId - Customer for whom work was done
   * @param contractId - Optional contract ID
   * @param serviceLevel - Optional service level (L1, L2, L3, project, consulting)
   * @param workType - Optional work type (support, project, consulting, emergency)
   * @param date - Date of the work (defaults to today)
   * @returns Object with billing_rate and cost_rate
   */
  static async resolveRates(
    userId: string,
    customerId: string,
    contractId?: string | null,
    serviceLevel?: string | null,
    workType?: string | null,
    date: Date = new Date()
  ): Promise<ResolvedRates> {
    logger.debug('Resolving billing rates', {
      userId,
      customerId,
      contractId,
      serviceLevel,
      workType,
      date,
    });

    // Step 1: Get user's internal cost rate (always needed)
    const costRate = await this.getUserCostRate(userId);

    // Step 2: Try to find specific billing rate from user_billing_rates
    const specificRate = await this.findSpecificBillingRate(
      userId,
      customerId,
      contractId,
      serviceLevel,
      workType,
      date
    );

    if (specificRate) {
      logger.info('Billing rate resolved from user_billing_rates', {
        userId,
        customerId,
        billingRate: specificRate,
        costRate,
      });
      return { billing_rate: specificRate, cost_rate: costRate };
    }

    // Step 3: Try contract default rate
    if (contractId) {
      const contractRate = await this.getContractRate(contractId);
      if (contractRate) {
        logger.info('Billing rate resolved from contract', {
          userId,
          customerId,
          contractId,
          billingRate: contractRate,
          costRate,
        });
        return { billing_rate: contractRate, cost_rate: costRate };
      }
    }

    // Step 4: Try user's default billing rate
    const userDefaultRate = await this.getUserDefaultRate(userId);
    if (userDefaultRate) {
      logger.info('Billing rate resolved from user default', {
        userId,
        customerId,
        billingRate: userDefaultRate,
        costRate,
      });
      return { billing_rate: userDefaultRate, cost_rate: costRate };
    }

    // Step 5: No rate found - error
    throw new ValidationError(
      `No billing rate configured for user ${userId} and customer ${customerId}`
    );
  }

  /**
   * Get user's internal cost rate
   */
  private static async getUserCostRate(userId: string): Promise<number> {
    const result = await query(
      `SELECT internal_cost_rate FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new ValidationError(`User ${userId} not found`);
    }

    const costRate = result.rows[0].internal_cost_rate;
    if (costRate === null || costRate === undefined) {
      throw new ValidationError(`User ${userId} has no internal cost rate configured`);
    }

    return parseFloat(costRate);
  }

  /**
   * Find most specific billing rate from user_billing_rates table
   *
   * Tries to match in order of specificity:
   * 1. user + contract + service_level + work_type
   * 2. user + contract + service_level
   * 3. user + contract + work_type
   * 4. user + contract
   * 5. user + customer + service_level + work_type
   * 6. user + customer + service_level
   * 7. user + customer + work_type
   * 8. user + customer
   */
  private static async findSpecificBillingRate(
    userId: string,
    customerId: string,
    contractId?: string | null,
    serviceLevel?: string | null,
    workType?: string | null,
    date: Date = new Date()
  ): Promise<number | null> {
    const result = await query(
      `SELECT billing_rate
       FROM user_billing_rates
       WHERE user_id = $1
         AND deleted_at IS NULL
         AND is_active = true
         AND valid_from <= $2
         AND (valid_until IS NULL OR valid_until >= $2)
         AND (
           -- Contract-based matches (highest priority)
           ($3::uuid IS NOT NULL AND contract_id = $3 AND
            ($4::varchar IS NOT NULL AND service_level = $4 OR service_level IS NULL) AND
            ($5::varchar IS NOT NULL AND work_type = $5 OR work_type IS NULL)
           )
           OR
           -- Customer-based matches (fallback)
           (customer_id = $6 AND
            ($4::varchar IS NOT NULL AND service_level = $4 OR service_level IS NULL) AND
            ($5::varchar IS NOT NULL AND work_type = $5 OR work_type IS NULL)
           )
         )
       ORDER BY
         -- Prioritize more specific matches
         (CASE WHEN contract_id IS NOT NULL THEN 1 ELSE 2 END),
         (CASE WHEN service_level IS NOT NULL THEN 1 ELSE 2 END),
         (CASE WHEN work_type IS NOT NULL THEN 1 ELSE 2 END),
         created_at DESC
       LIMIT 1`,
      [userId, date, contractId, serviceLevel, workType, customerId]
    );

    if (result.rows.length > 0) {
      return parseFloat(result.rows[0].billing_rate);
    }

    return null;
  }

  /**
   * Get contract's default hourly rate
   */
  private static async getContractRate(contractId: string): Promise<number | null> {
    const result = await query(
      `SELECT hourly_rate FROM contracts
       WHERE id = $1 AND hourly_rate IS NOT NULL AND deleted_at IS NULL`,
      [contractId]
    );

    if (result.rows.length > 0 && result.rows[0].hourly_rate) {
      return parseFloat(result.rows[0].hourly_rate);
    }

    return null;
  }

  /**
   * Get user's default billing rate
   */
  private static async getUserDefaultRate(userId: string): Promise<number | null> {
    const result = await query(
      `SELECT default_billing_rate FROM users
       WHERE id = $1 AND default_billing_rate IS NOT NULL AND deleted_at IS NULL`,
      [userId]
    );

    if (result.rows.length > 0 && result.rows[0].default_billing_rate) {
      return parseFloat(result.rows[0].default_billing_rate);
    }

    return null;
  }

  /**
   * Calculate total revenue and cost for a time entry
   */
  static calculateTotals(hours: number, billingRate: number, costRate: number): {
    revenue: number;
    cost: number;
    profit: number;
    marginPercent: number;
  } {
    const revenue = hours * billingRate;
    const cost = hours * costRate;
    const profit = revenue - cost;
    const marginPercent = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      revenue: parseFloat(revenue.toFixed(2)),
      cost: parseFloat(cost.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      marginPercent: parseFloat(marginPercent.toFixed(2)),
    };
  }
}
