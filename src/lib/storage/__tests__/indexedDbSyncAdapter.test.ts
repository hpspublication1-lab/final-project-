import { describe, it, expect, beforeEach } from 'vitest';
import { cbtStorage } from '../indexedDbSyncAdapter';

describe('IndexedDB Sync Adapter & Zero Data-Loss Engine', () => {
  beforeEach(async () => {
    await cbtStorage.init();
  });

  it('should record local answer within latency budget (< 50ms)', async () => {
    const result = await cbtStorage.recordAnswerLocal({
      attemptId: 'att_test_123',
      examId: 'exam_cee_01',
      questionId: 'q_phy_01',
      selectedOption: 'b',
    });

    expect(result.success).toBe(true);
    expect(result.writeTimeMs).toBeLessThan(50);
    expect(result.syncHash).toMatch(/^sync_/);
    expect(result.telemetry.lastServerAck).toBe(200);
  });

  it('should retrieve saved answers for an attempt', async () => {
    await cbtStorage.recordAnswerLocal({
      attemptId: 'att_test_456',
      examId: 'exam_cee_01',
      questionId: 'q_chem_01',
      selectedOption: 'c',
    });

    await cbtStorage.recordAnswerLocal({
      attemptId: 'att_test_456',
      examId: 'exam_cee_01',
      questionId: 'q_chem_02',
      selectedOption: 'a',
    });

    const answers = await cbtStorage.getAnswersForAttempt('att_test_456');
    expect(answers['q_chem_01']).toBe('c');
    expect(answers['q_chem_02']).toBe('a');
  });

  it('should report live telemetry and server ACK', () => {
    cbtStorage.recordServerAck(200, 18);
    const telemetry = cbtStorage.getTelemetry();

    expect(telemetry.lastServerAck).toBe(200);
    expect(telemetry.latencyMs).toBe(18);
    expect(telemetry.pendingCount).toBe(0);
  });
});
