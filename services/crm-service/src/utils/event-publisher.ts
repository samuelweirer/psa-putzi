/**
 * RabbitMQ Event Publisher
 *
 * Publishes domain events to RabbitMQ for event-driven architecture.
 * Implements connection pooling and graceful error handling.
 */

import { connect, Connection, Channel } from 'amqplib/callback_api';
import config from './config';
import logger from './logger';

/**
 * Base event interface
 */
export interface DomainEvent {
  eventType: string;
  eventVersion: string;
  timestamp: string;
  tenantId: string;
  userId?: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Event Publisher Singleton
 */
class EventPublisher {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly exchange = 'psa.events';
  private isConnecting = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize connection to RabbitMQ
   */
  async connect(): Promise<void> {
    if (this.connection && this.channel) {
      return; // Already connected
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      await this.waitForConnection();
      return;
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        logger.info('Connecting to RabbitMQ', { url: config.rabbitmq.url });

        connect(config.rabbitmq.url, (err, conn) => {
          if (err) {
            this.isConnecting = false;
            logger.error('Failed to connect to RabbitMQ', { error: err.message });
            this.scheduleReconnect();
            reject(err);
            return;
          }

          this.connection = conn;

          conn.createChannel((channelErr, ch) => {
            if (channelErr) {
              this.isConnecting = false;
              logger.error('Failed to create channel', { error: channelErr.message });
              reject(channelErr);
              return;
            }

            this.channel = ch;

            // Declare exchange (topic exchange for routing)
            ch.assertExchange(this.exchange, 'topic', { durable: true, autoDelete: false }, (exchangeErr) => {
              if (exchangeErr) {
                this.isConnecting = false;
                logger.error('Failed to assert exchange', { error: exchangeErr.message });
                reject(exchangeErr);
                return;
              }

              // Handle connection errors
              conn.on('error', (connErr) => {
                logger.error('RabbitMQ connection error', { error: connErr.message });
                this.handleConnectionLoss();
              });

              conn.on('close', () => {
                logger.warn('RabbitMQ connection closed');
                this.handleConnectionLoss();
              });

              logger.info('Connected to RabbitMQ successfully');
              this.isConnecting = false;
              resolve();
            });
          });
        });
      } catch (error) {
        this.isConnecting = false;
        logger.error('Exception during RabbitMQ connection', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        this.scheduleReconnect();
        reject(error);
      }
    });
  }

  /**
   * Wait for an ongoing connection attempt to complete
   */
  private async waitForConnection(maxWait = 5000): Promise<void> {
    const startTime = Date.now();
    while (this.isConnecting && Date.now() - startTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Handle connection loss and attempt reconnection
   */
  private handleConnectionLoss(): void {
    this.connection = null;
    this.channel = null;
    this.scheduleReconnect();
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      logger.info('Attempting to reconnect to RabbitMQ');
      this.connect().catch((err) => {
        logger.error('Reconnection failed', { error: err.message });
      });
    }, 5000); // Retry after 5 seconds
  }

  /**
   * Publish an event to RabbitMQ
   *
   * @param routingKey - Routing key for the event (e.g., 'customer.created', 'contact.updated')
   * @param event - Event payload
   */
  async publish(routingKey: string, event: DomainEvent): Promise<void> {
    try {
      // Ensure connection is established
      if (!this.channel) {
        await this.connect();
      }

      if (!this.channel) {
        throw new Error('RabbitMQ channel not available');
      }

      // Publish event to exchange
      const message = Buffer.from(JSON.stringify(event));
      const published = this.channel.publish(this.exchange, routingKey, message, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
      });

      if (!published) {
        logger.warn('Failed to publish event (channel buffer full)', {
          routingKey,
          eventType: event.eventType,
        });
        // Event will be queued internally by amqplib
      } else {
        logger.debug('Event published successfully', {
          routingKey,
          eventType: event.eventType,
          tenantId: event.tenantId,
        });
      }
    } catch (error) {
      logger.error('Failed to publish event', {
        routingKey,
        eventType: event.eventType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Don't throw - we don't want to fail the API request if event publishing fails
      // The event will be lost, but the operation succeeded
    }
  }

  /**
   * Close connection to RabbitMQ
   */
  async close(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    return new Promise((resolve) => {
      try {
        if (this.channel) {
          this.channel.close(() => {
            this.channel = null;
            logger.info('RabbitMQ channel closed');

            if (this.connection) {
              this.connection.close(() => {
                this.connection = null;
                logger.info('RabbitMQ connection closed');
                resolve();
              });
            } else {
              resolve();
            }
          });
        } else if (this.connection) {
          this.connection.close(() => {
            this.connection = null;
            logger.info('RabbitMQ connection closed');
            resolve();
          });
        } else {
          resolve();
        }
      } catch (error) {
        logger.error('Error closing RabbitMQ connection', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        resolve(); // Resolve anyway to allow graceful shutdown
      }
    });
  }
}

// Export singleton instance
export const eventPublisher = new EventPublisher();

/**
 * Helper function to create a domain event
 */
export function createDomainEvent(
  eventType: string,
  tenantId: string,
  data: Record<string, unknown>,
  userId?: string,
  metadata?: Record<string, unknown>
): DomainEvent {
  return {
    eventType,
    eventVersion: '1.0.0',
    timestamp: new Date().toISOString(),
    tenantId,
    userId,
    data,
    metadata,
  };
}
