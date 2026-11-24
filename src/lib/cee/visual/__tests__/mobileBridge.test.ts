import { describe, it, expect, vi } from 'vitest';
import {
  BridgeMessageSchema,
  MobileBridgeAdapter,
  type BridgeMessage,
} from '../mobileBridge';

describe('CEE Mobile Bridge Protocol (FND-010)', () => {
  it('should validate canonical bridge message schema', () => {
    const validMessage: BridgeMessage = {
      protocolVersion: 1,
      messageId: 'msg_test_01',
      timestamp: '2026-11-23T16:30:00.000Z',
      type: 'STRUCTURE_SELECTED',
      lessonId: 'human-heart',
      payload: { hotspotId: 'hp_ra', label: 'Right Atrium' },
    };

    const result = BridgeMessageSchema.safeParse(validMessage);
    expect(result.success).toBe(true);
  });

  it('should reject messages with outdated or invalid protocolVersion', () => {
    const invalidMessage = {
      protocolVersion: 2,
      messageId: 'msg_test_02',
      type: 'PLAYER_READY',
      lessonId: 'human-heart',
      payload: {},
    };

    const result = BridgeMessageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });

  it('should reject messages with unsupported action types (preventing arbitrary commands)', () => {
    const invalidMessage = {
      protocolVersion: 1,
      messageId: 'msg_test_03',
      type: 'EXECUTE_ARBITRARY_COMMAND',
      lessonId: 'human-heart',
      payload: {},
    };

    const result = BridgeMessageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });

  it('should dispatch postToHost without throwing in node/headless environment', () => {
    const bridge = new MobileBridgeAdapter({ lessonId: 'human-heart' });
    const result = bridge.postToHost('PLAYER_READY', { state: 'ready' });

    expect(result.messageId).toBeDefined();
    bridge.destroy();
  });
});
