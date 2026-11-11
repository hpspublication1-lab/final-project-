"use strict";
/**
 * Samyak Multiplayer Service — Operational Metrics & Health Observability
 * Telemetry counters, connection gauges, and system health status.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsCollector = exports.MetricsCollector = void 0;
class MetricsCollector {
    startTime = Date.now();
    activeRooms = 0;
    connectedClients = 0;
    totalMatches = 0;
    totalQuestionsEvaluated = 0;
    totalAntiCheatFlags = 0;
    incrementRooms() {
        this.activeRooms += 1;
    }
    decrementRooms() {
        this.activeRooms = Math.max(0, this.activeRooms - 1);
    }
    incrementClients() {
        this.connectedClients += 1;
    }
    decrementClients() {
        this.connectedClients = Math.max(0, this.connectedClients - 1);
    }
    recordMatchCompleted() {
        this.totalMatches += 1;
    }
    recordQuestionEvaluated() {
        this.totalQuestionsEvaluated += 1;
    }
    recordAntiCheatFlag() {
        this.totalAntiCheatFlags += 1;
    }
    getSnapshot() {
        const mem = process.memoryUsage();
        return {
            service: 'samyak-multiplayer-service',
            version: '1.0.0-staging',
            status: 'healthy',
            uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
            activeRooms: this.activeRooms,
            connectedClients: this.connectedClients,
            totalMatchesProcessed: this.totalMatches,
            totalQuestionsEvaluated: this.totalQuestionsEvaluated,
            totalAntiCheatFlags: this.totalAntiCheatFlags,
            memoryUsageMb: {
                rss: Math.round(mem.rss / 1024 / 1024),
                heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
                heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
            },
            timestamp: new Date().toISOString(),
        };
    }
}
exports.MetricsCollector = MetricsCollector;
exports.metricsCollector = new MetricsCollector();
