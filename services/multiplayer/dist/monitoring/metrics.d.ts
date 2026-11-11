/**
 * Samyak Multiplayer Service — Operational Metrics & Health Observability
 * Telemetry counters, connection gauges, and system health status.
 */
export interface SystemMetricsSnapshot {
    service: string;
    version: string;
    status: 'healthy' | 'degraded' | 'down';
    uptimeSeconds: number;
    activeRooms: number;
    connectedClients: number;
    totalMatchesProcessed: number;
    totalQuestionsEvaluated: number;
    totalAntiCheatFlags: number;
    memoryUsageMb: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
    };
    timestamp: string;
}
export declare class MetricsCollector {
    private startTime;
    private activeRooms;
    private connectedClients;
    private totalMatches;
    private totalQuestionsEvaluated;
    private totalAntiCheatFlags;
    incrementRooms(): void;
    decrementRooms(): void;
    incrementClients(): void;
    decrementClients(): void;
    recordMatchCompleted(): void;
    recordQuestionEvaluated(): void;
    recordAntiCheatFlag(): void;
    getSnapshot(): SystemMetricsSnapshot;
}
export declare const metricsCollector: MetricsCollector;
