/**
 * Circuit Breaker middleware for API Gateway
 * Prevents cascading failures by stopping requests to failing services
 * Implements the Circuit Breaker pattern with three states: CLOSED, OPEN, HALF_OPEN
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation, requests pass through
  OPEN = 'OPEN',         // Circuit is open, requests are rejected immediately
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening circuit
  successThreshold: number;      // Number of successes needed to close circuit in HALF_OPEN
  timeout: number;               // Time in ms before attempting to close circuit
  monitoringPeriod: number;      // Time window in ms for counting failures
}

/**
 * Circuit breaker statistics
 */
interface CircuitStats {
  failures: number;
  successes: number;
  totalRequests: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
}

/**
 * Circuit Breaker class
 * Manages the state and behavior of a single circuit
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private stats: CircuitStats = {
    failures: 0,
    successes: 0,
    totalRequests: 0,
    lastFailureTime: null,
    lastSuccessTime: null,
  };
  private nextAttempt: number = Date.now();
  private config: CircuitBreakerConfig;
  private serviceName: string;

  constructor(serviceName: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.serviceName = serviceName;
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 60000, // 60 seconds
      monitoringPeriod: config.monitoringPeriod || 60000, // 60 seconds
    };
  }

  /**
   * Check if request can pass through the circuit
   */
  public canRequest(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      // Check if timeout has passed
      if (Date.now() >= this.nextAttempt) {
        logger.info(`Circuit breaker entering HALF_OPEN state`, {
          service: this.serviceName,
          previousState: this.state,
        });
        this.state = CircuitState.HALF_OPEN;
        this.stats.successes = 0;
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow limited requests through
    return true;
  }

  /**
   * Record a successful request
   */
  public recordSuccess(): void {
    this.stats.totalRequests++;
    this.stats.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.stats.successes++;

      if (this.stats.successes >= this.config.successThreshold) {
        logger.info(`Circuit breaker closing - service recovered`, {
          service: this.serviceName,
          successCount: this.stats.successes,
          threshold: this.config.successThreshold,
        });
        this.close();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in CLOSED state
      this.stats.failures = 0;
    }
  }

  /**
   * Record a failed request
   */
  public recordFailure(): void {
    this.stats.totalRequests++;
    this.stats.failures++;
    this.stats.lastFailureTime = Date.now();

    logger.warn(`Circuit breaker recorded failure`, {
      service: this.serviceName,
      state: this.state,
      failures: this.stats.failures,
      threshold: this.config.failureThreshold,
    });

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in HALF_OPEN state opens the circuit again
      this.open();
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we've hit the failure threshold
      if (this.stats.failures >= this.config.failureThreshold) {
        this.open();
      }
    }
  }

  /**
   * Open the circuit (stop allowing requests)
   */
  private open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.config.timeout;

    logger.error(`Circuit breaker OPENED - service unavailable`, {
      service: this.serviceName,
      failures: this.stats.failures,
      nextAttempt: new Date(this.nextAttempt).toISOString(),
    });
  }

  /**
   * Close the circuit (allow requests)
   */
  private close(): void {
    this.state = CircuitState.CLOSED;
    this.stats.failures = 0;
    this.stats.successes = 0;
  }

  /**
   * Get current state
   */
  public getState(): CircuitState {
    return this.state;
  }

  /**
   * Get statistics
   */
  public getStats(): CircuitStats & { state: CircuitState; nextAttempt: number | null } {
    return {
      ...this.stats,
      state: this.state,
      nextAttempt: this.state === CircuitState.OPEN ? this.nextAttempt : null,
    };
  }

  /**
   * Reset the circuit breaker
   */
  public reset(): void {
    this.state = CircuitState.CLOSED;
    this.stats = {
      failures: 0,
      successes: 0,
      totalRequests: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
    };
    this.nextAttempt = Date.now();

    logger.info(`Circuit breaker reset`, {
      service: this.serviceName,
    });
  }
}

/**
 * Circuit breaker registry
 * Manages circuit breakers for all services
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker for a service
   */
  public getBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, new CircuitBreaker(serviceName, config));
    }
    return this.breakers.get(serviceName)!;
  }

  /**
   * Get all circuit breakers
   */
  public getAllBreakers(): Map<string, CircuitBreaker> {
    return this.breakers;
  }

  /**
   * Get health status of all circuits
   */
  public getHealthStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    this.breakers.forEach((breaker, serviceName) => {
      status[serviceName] = breaker.getStats();
    });

    return status;
  }

  /**
   * Reset all circuit breakers
   */
  public resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

// Global circuit breaker registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Middleware factory to create circuit breaker middleware for a service
 *
 * @param serviceName - Name of the service
 * @param config - Circuit breaker configuration
 * @returns Express middleware function
 */
export function createCircuitBreakerMiddleware(
  serviceName: string,
  config?: Partial<CircuitBreakerConfig>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    const breaker = circuitBreakerRegistry.getBreaker(serviceName, config);

    // Check if circuit allows requests
    if (!breaker.canRequest()) {
      logger.warn(`Circuit breaker rejected request - service unavailable`, {
        requestId: authReq.id,
        service: serviceName,
        state: breaker.getState(),
        path: req.path,
      });

      res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: `Service ${serviceName} is temporarily unavailable`,
          status: 503,
          timestamp: new Date().toISOString(),
          request_id: authReq.id,
          retryAfter: breaker.getStats().nextAttempt
            ? Math.ceil((breaker.getStats().nextAttempt! - Date.now()) / 1000)
            : 60,
        },
      });
      return;
    }

    // Intercept response to record success/failure
    const originalSend = res.send;
    res.send = function(data: any): Response {
      // Record success or failure based on status code
      if (res.statusCode >= 500) {
        breaker.recordFailure();
      } else {
        breaker.recordSuccess();
      }

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Export types and classes
 */
export { CircuitBreaker, CircuitState, CircuitBreakerConfig, CircuitStats };
