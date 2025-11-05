"use strict";
/**
 * RabbitMQ Event Publisher
 *
 * Publishes domain events to RabbitMQ for event-driven architecture.
 * Implements connection pooling and graceful error handling.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventPublisher = void 0;
exports.createDomainEvent = createDomainEvent;
const callback_api_1 = require("amqplib/callback_api");
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Event Publisher Singleton
 */
class EventPublisher {
    connection = null;
    channel = null;
    exchange = 'psa.events';
    isConnecting = false;
    reconnectTimer = null;
    /**
     * Initialize connection to RabbitMQ
     */
    async connect() {
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
                logger_1.default.info('Connecting to RabbitMQ', { url: config_1.default.rabbitmq.url });
                (0, callback_api_1.connect)(config_1.default.rabbitmq.url, (err, conn) => {
                    if (err) {
                        this.isConnecting = false;
                        logger_1.default.error('Failed to connect to RabbitMQ', { error: err.message });
                        this.scheduleReconnect();
                        reject(err);
                        return;
                    }
                    this.connection = conn;
                    conn.createChannel((channelErr, ch) => {
                        if (channelErr) {
                            this.isConnecting = false;
                            logger_1.default.error('Failed to create channel', { error: channelErr.message });
                            reject(channelErr);
                            return;
                        }
                        this.channel = ch;
                        // Declare exchange (topic exchange for routing)
                        ch.assertExchange(this.exchange, 'topic', { durable: true, autoDelete: false }, (exchangeErr) => {
                            if (exchangeErr) {
                                this.isConnecting = false;
                                logger_1.default.error('Failed to assert exchange', { error: exchangeErr.message });
                                reject(exchangeErr);
                                return;
                            }
                            // Handle connection errors
                            conn.on('error', (connErr) => {
                                logger_1.default.error('RabbitMQ connection error', { error: connErr.message });
                                this.handleConnectionLoss();
                            });
                            conn.on('close', () => {
                                logger_1.default.warn('RabbitMQ connection closed');
                                this.handleConnectionLoss();
                            });
                            logger_1.default.info('Connected to RabbitMQ successfully');
                            this.isConnecting = false;
                            resolve();
                        });
                    });
                });
            }
            catch (error) {
                this.isConnecting = false;
                logger_1.default.error('Exception during RabbitMQ connection', {
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
    async waitForConnection(maxWait = 5000) {
        const startTime = Date.now();
        while (this.isConnecting && Date.now() - startTime < maxWait) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
    /**
     * Handle connection loss and attempt reconnection
     */
    handleConnectionLoss() {
        this.connection = null;
        this.channel = null;
        this.scheduleReconnect();
    }
    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectTimer) {
            return; // Already scheduled
        }
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            logger_1.default.info('Attempting to reconnect to RabbitMQ');
            this.connect().catch((err) => {
                logger_1.default.error('Reconnection failed', { error: err.message });
            });
        }, 5000); // Retry after 5 seconds
    }
    /**
     * Publish an event to RabbitMQ
     *
     * @param routingKey - Routing key for the event (e.g., 'customer.created', 'contact.updated')
     * @param event - Event payload
     */
    async publish(routingKey, event) {
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
                logger_1.default.warn('Failed to publish event (channel buffer full)', {
                    routingKey,
                    eventType: event.eventType,
                });
                // Event will be queued internally by amqplib
            }
            else {
                logger_1.default.debug('Event published successfully', {
                    routingKey,
                    eventType: event.eventType,
                    tenantId: event.tenantId,
                });
            }
        }
        catch (error) {
            logger_1.default.error('Failed to publish event', {
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
    async close() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        return new Promise((resolve) => {
            try {
                if (this.channel) {
                    this.channel.close(() => {
                        this.channel = null;
                        logger_1.default.info('RabbitMQ channel closed');
                        if (this.connection) {
                            this.connection.close(() => {
                                this.connection = null;
                                logger_1.default.info('RabbitMQ connection closed');
                                resolve();
                            });
                        }
                        else {
                            resolve();
                        }
                    });
                }
                else if (this.connection) {
                    this.connection.close(() => {
                        this.connection = null;
                        logger_1.default.info('RabbitMQ connection closed');
                        resolve();
                    });
                }
                else {
                    resolve();
                }
            }
            catch (error) {
                logger_1.default.error('Error closing RabbitMQ connection', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                resolve(); // Resolve anyway to allow graceful shutdown
            }
        });
    }
}
// Export singleton instance
exports.eventPublisher = new EventPublisher();
/**
 * Helper function to create a domain event
 */
function createDomainEvent(eventType, tenantId, data, userId, metadata) {
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
//# sourceMappingURL=event-publisher.js.map