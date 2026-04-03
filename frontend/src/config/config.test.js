import { FEATURES, APP_CONFIG } from './config';

describe('Config System', () => {
  it('FEATURES object is frozen (immutable)', () => {
    expect(Object.isFrozen(FEATURES)).toBe(true);
    // Ensure we can't mutate it
    expect(() => {
      FEATURES.SHOW_CHOTA_CHAT = true;
    }).toThrow();
  });

  it('SHOW_CHOTA_CHAT defaults to false', () => {
    expect(FEATURES.SHOW_CHOTA_CHAT).toBe(false);
  });

  it('Accessing undefined flag returns undefined (not throws)', () => {
    expect(FEATURES.NON_EXISTENT_FLAG).toBeUndefined();
  });

  it('APP_CONFIG.APP_NAME exists and is a string', () => {
    expect(typeof APP_CONFIG.APP_NAME).toBe('string');
    expect(APP_CONFIG.APP_NAME.length).toBeGreaterThan(0);
  });
});
