import { describe, it, expect } from 'vitest';
import { autonomousWorker } from '../serverAutonomousWorker';

describe('Server Autonomous Background Worker Daemon', () => {
  it('should initialize with valid default state', () => {
    const state = autonomousWorker.getState();
    expect(state).toBeDefined();
    expect(state.frequencyMinutes).toBeGreaterThanOrEqual(5);
    expect(state.logs.length).toBeGreaterThan(0);
    expect(state.activeCurriculumTarget).toBeDefined();
  });

  it('should support pausing and starting the background daemon', () => {
    autonomousWorker.stop();
    let state = autonomousWorker.getState();
    expect(state.isRunning).toBe(false);
    expect(state.nextCycleAt).toBeNull();

    autonomousWorker.start(45);
    state = autonomousWorker.getState();
    expect(state.isRunning).toBe(true);
    expect(state.frequencyMinutes).toBe(45);
    expect(state.nextCycleAt).not.toBeNull();
  });

  it('should record structured telemetry logs', () => {
    autonomousWorker.addLog('info', 'TEST_EVENT', 'Testing telemetry recording');
    const state = autonomousWorker.getState();
    const lastLog = state.logs[state.logs.length - 1];
    expect(lastLog.action).toBe('TEST_EVENT');
    expect(lastLog.details).toBe('Testing telemetry recording');
    expect(lastLog.timestamp).toBeDefined();
  });
});
