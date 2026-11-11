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

export class MetricsCollector {
  private startTime = Date.now();
  private activeRooms = 0;
  private connectedClients = 0;
  private totalMatches = 0;
  private totalQuestionsEvaluated = 0;
  private totalAntiCheatFlags = 0;

  incrementRooms(): void {
    this.activeRooms += 1;
  }

  decrementRooms(): void {
    this.activeRooms = Math.max(0, this.activeRooms - 1);
  }

  incrementClients(): void {
    this.connectedClients += 1;
  }

  decrementClients(): void {
    this.connectedClients = Math.max(0, this.connectedClients - 1);
  }

  recordMatchCompleted(): void {
    this.totalMatches += 1;
  }

  recordQuestionEvaluated(): void {
    this.totalQuestionsEvaluated += 1;
  }

  recordAntiCheatFlag(): void {
    this.totalAntiCheatFlags += 1;
  }

  getSnapshot(): SystemMetricsSnapshot {
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

export const metricsCollector = new MetricsCollector();
