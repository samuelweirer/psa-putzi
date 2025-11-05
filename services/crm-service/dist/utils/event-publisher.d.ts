/**
 * RabbitMQ Event Publisher
 *
 * Publishes domain events to RabbitMQ for event-driven architecture.
 * Implements connection pooling and graceful error handling.
 */
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
declare class EventPublisher {
    private connection;
    private channel;
    private readonly exchange;
    private isConnecting;
    private reconnectTimer;
    /**
     * Initialize connection to RabbitMQ
     */
    connect(): Promise<void>;
    /**
     * Wait for an ongoing connection attempt to complete
     */
    private waitForConnection;
    /**
     * Handle connection loss and attempt reconnection
     */
    private handleConnectionLoss;
    /**
     * Schedule reconnection attempt
     */
    private scheduleReconnect;
    /**
     * Publish an event to RabbitMQ
     *
     * @param routingKey - Routing key for the event (e.g., 'customer.created', 'contact.updated')
     * @param event - Event payload
     */
    publish(routingKey: string, event: DomainEvent): Promise<void>;
    /**
     * Close connection to RabbitMQ
     */
    close(): Promise<void>;
}
export declare const eventPublisher: EventPublisher;
/**
 * Helper function to create a domain event
 */
export declare function createDomainEvent(eventType: string, tenantId: string, data: Record<string, unknown>, userId?: string, metadata?: Record<string, unknown>): DomainEvent;
export {};
//# sourceMappingURL=event-publisher.d.ts.map