/**
 * Unit tests for Billing Rate Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingRateService } from '../../../src/services/billing-rate.service';
import * as database from '../../../src/utils/database';

// Mock the database module
vi.mock('../../../src/utils/database', () => ({
  query: vi.fn(),
}));

describe('BillingRateService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('resolveRates - Level 1: user_billing_rates (most specific)', () => {
    it('should resolve rate from user_billing_rates with all parameters', async () => {
      const userId = 'user-123';
      const customerId = 'customer-456';
      const contractId = 'contract-789';
      const serviceLevel = 'L2';
      const workType = 'support';

      // Mock getUserCostRate query
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ internal_cost_rate: '50.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock findSpecificBillingRate query - return specific rate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ billing_rate: '150.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await BillingRateService.resolveRates(
        userId,
        customerId,
        contractId,
        serviceLevel,
        workType
      );

      expect(result).toEqual({
        billing_rate: 150,
        cost_rate: 50,
      });

      // Verify queries were called correctly
      expect(database.query).toHaveBeenCalledTimes(2);

      // First call: getUserCostRate
      expect(database.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT internal_cost_rate FROM users'),
        [userId]
      );

      // Second call: findSpecificBillingRate
      expect(database.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('FROM user_billing_rates'),
        expect.arrayContaining([userId, expect.any(Date), contractId, serviceLevel, workType, customerId])
      );
    });

    it('should resolve rate from user_billing_rates for customer (no contract)', async () => {
      const userId = 'user-123';
      const customerId = 'customer-456';

      // Mock getUserCostRate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ internal_cost_rate: '50.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock findSpecificBillingRate - return customer-level rate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ billing_rate: '120.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await BillingRateService.resolveRates(
        userId,
        customerId,
        null, // no contract
        null,
        null
      );

      expect(result).toEqual({
        billing_rate: 120,
        cost_rate: 50,
      });

      expect(database.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('resolveRates - Level 2: contract default rate', () => {
    it('should fall back to contract rate when no specific rate found', async () => {
      const userId = 'user-123';
      const customerId = 'customer-456';
      const contractId = 'contract-789';

      // Mock getUserCostRate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ internal_cost_rate: '50.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock findSpecificBillingRate - no specific rate found
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock getContractRate - return contract default
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ hourly_rate: '130.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await BillingRateService.resolveRates(
        userId,
        customerId,
        contractId
      );

      expect(result).toEqual({
        billing_rate: 130,
        cost_rate: 50,
      });

      expect(database.query).toHaveBeenCalledTimes(3);

      // Third call: getContractRate
      expect(database.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('SELECT hourly_rate FROM contracts'),
        [contractId]
      );
    });

    it('should skip contract rate if contract has no hourly_rate', async () => {
      const userId = 'user-123';
      const customerId = 'customer-456';
      const contractId = 'contract-789';

      // Mock getUserCostRate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ internal_cost_rate: '50.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock findSpecificBillingRate - no specific rate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock getContractRate - contract has no rate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock getUserDefaultRate - use user default
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ default_billing_rate: '100.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await BillingRateService.resolveRates(
        userId,
        customerId,
        contractId
      );

      expect(result).toEqual({
        billing_rate: 100,
        cost_rate: 50,
      });

      expect(database.query).toHaveBeenCalledTimes(4);
    });
  });

  describe('resolveRates - Level 3: user default rate', () => {
    it('should fall back to user default rate when no specific or contract rate found', async () => {
      const userId = 'user-123';
      const customerId = 'customer-456';

      // Mock getUserCostRate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ internal_cost_rate: '50.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock findSpecificBillingRate - no specific rate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock getUserDefaultRate - use user default
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ default_billing_rate: '100.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await BillingRateService.resolveRates(
        userId,
        customerId,
        null // no contract
      );

      expect(result).toEqual({
        billing_rate: 100,
        cost_rate: 50,
      });

      expect(database.query).toHaveBeenCalledTimes(3);

      // Third call: getUserDefaultRate
      expect(database.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('SELECT default_billing_rate FROM users'),
        [userId]
      );
    });
  });

  describe('resolveRates - Level 4: Error when no rate found', () => {
    it('should throw error when no billing rate configured', async () => {
      const userId = 'user-123';
      const customerId = 'customer-456';

      // Mock getUserCostRate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ internal_cost_rate: '50.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock findSpecificBillingRate - no specific rate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock getUserDefaultRate - no default rate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(
        BillingRateService.resolveRates(userId, customerId, null)
      ).rejects.toThrow(
        `No billing rate configured for user ${userId} and customer ${customerId}`
      );

      expect(database.query).toHaveBeenCalledTimes(3);
    });

    it('should throw error when user not found', async () => {
      const userId = 'nonexistent-user';
      const customerId = 'customer-456';

      // Mock getUserCostRate - user not found
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(
        BillingRateService.resolveRates(userId, customerId, null)
      ).rejects.toThrow(`User ${userId} not found`);

      expect(database.query).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user has no internal cost rate', async () => {
      const userId = 'user-123';
      const customerId = 'customer-456';

      // Mock getUserCostRate - user exists but no cost rate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ internal_cost_rate: null }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(
        BillingRateService.resolveRates(userId, customerId, null)
      ).rejects.toThrow(`User ${userId} has no internal cost rate configured`);

      expect(database.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('calculateTotals', () => {
    it('should calculate revenue, cost, profit, and margin correctly', () => {
      const result = BillingRateService.calculateTotals(
        10, // hours
        150, // billingRate
        50 // costRate
      );

      expect(result).toEqual({
        revenue: 1500.0, // 10 * 150
        cost: 500.0, // 10 * 50
        profit: 1000.0, // 1500 - 500
        marginPercent: 66.67, // (1000 / 1500) * 100
      });
    });

    it('should handle fractional hours correctly', () => {
      const result = BillingRateService.calculateTotals(
        2.5, // hours
        120, // billingRate
        40 // costRate
      );

      expect(result).toEqual({
        revenue: 300.0, // 2.5 * 120
        cost: 100.0, // 2.5 * 40
        profit: 200.0, // 300 - 100
        marginPercent: 66.67, // (200 / 300) * 100
      });
    });

    it('should handle zero margin (break-even)', () => {
      const result = BillingRateService.calculateTotals(
        5, // hours
        100, // billingRate
        100 // costRate (same as billing = break-even)
      );

      expect(result).toEqual({
        revenue: 500.0,
        cost: 500.0,
        profit: 0.0,
        marginPercent: 0.0,
      });
    });

    it('should handle negative margin (loss)', () => {
      const result = BillingRateService.calculateTotals(
        5, // hours
        80, // billingRate
        100 // costRate (higher than billing = loss)
      );

      expect(result).toEqual({
        revenue: 400.0,
        cost: 500.0,
        profit: -100.0,
        marginPercent: -25.0, // (-100 / 400) * 100
      });
    });

    it('should handle zero revenue edge case', () => {
      const result = BillingRateService.calculateTotals(
        0, // no hours
        150,
        50
      );

      expect(result).toEqual({
        revenue: 0.0,
        cost: 0.0,
        profit: 0.0,
        marginPercent: 0.0, // Avoid division by zero
      });
    });

    it('should handle high precision and round to 2 decimals', () => {
      const result = BillingRateService.calculateTotals(
        3.333333, // hours
        99.99, // billingRate
        33.33 // costRate
      );

      // Should round to 2 decimal places
      expect(result.revenue).toBeCloseTo(333.3, 1);
      expect(result.cost).toBeCloseTo(111.1, 1);
      expect(result.profit).toBeCloseTo(222.2, 1);
      expect(result.marginPercent).toBeCloseTo(66.67, 1);
    });

    it('should calculate 100% margin when cost is zero', () => {
      const result = BillingRateService.calculateTotals(
        5, // hours
        100, // billingRate
        0 // zero cost = 100% profit
      );

      expect(result).toEqual({
        revenue: 500.0,
        cost: 0.0,
        profit: 500.0,
        marginPercent: 100.0, // (500 / 500) * 100
      });
    });
  });

  describe('rate resolution priority and specificity', () => {
    it('should prefer specific rate over contract rate', async () => {
      const userId = 'user-123';
      const customerId = 'customer-456';
      const contractId = 'contract-789';

      // Mock getUserCostRate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ internal_cost_rate: '50.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock findSpecificBillingRate - return specific rate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ billing_rate: '175.00' }], // Specific rate
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // getContractRate should NOT be called because specific rate was found

      const result = await BillingRateService.resolveRates(
        userId,
        customerId,
        contractId
      );

      expect(result.billing_rate).toBe(175); // Used specific rate, not contract
      expect(database.query).toHaveBeenCalledTimes(2); // Only cost + specific, no contract query
    });

    it('should prefer contract rate over user default', async () => {
      const userId = 'user-123';
      const customerId = 'customer-456';
      const contractId = 'contract-789';

      // Mock getUserCostRate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ internal_cost_rate: '50.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock findSpecificBillingRate - no specific rate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock getContractRate - return contract rate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ hourly_rate: '140.00' }], // Contract rate
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // getUserDefaultRate should NOT be called because contract rate was found

      const result = await BillingRateService.resolveRates(
        userId,
        customerId,
        contractId
      );

      expect(result.billing_rate).toBe(140); // Used contract rate, not user default
      expect(database.query).toHaveBeenCalledTimes(3); // Cost + specific + contract, no default query
    });
  });

  describe('date-based rate validity', () => {
    it('should use date parameter when resolving specific rates', async () => {
      const userId = 'user-123';
      const customerId = 'customer-456';
      const specificDate = new Date('2025-12-01');

      // Mock getUserCostRate
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ internal_cost_rate: '50.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock findSpecificBillingRate - should receive the date
      vi.mocked(database.query).mockResolvedValueOnce({
        rows: [{ billing_rate: '150.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await BillingRateService.resolveRates(
        userId,
        customerId,
        null,
        null,
        null,
        specificDate
      );

      // Verify the date was passed to findSpecificBillingRate query
      expect(database.query).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.arrayContaining([userId, specificDate, null, null, null, customerId])
      );
    });
  });
});
