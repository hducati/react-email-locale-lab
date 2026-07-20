import { describe, expect, it } from 'vitest';
import { shouldReloadForUpdates } from './watch';

describe('shouldReloadForUpdates', () => {
  it('reloads for script modules anywhere when no paths are configured', () => {
    expect(
      shouldReloadForUpdates(['/src/domains/orders/mail/order-confirmed.tsx']),
    ).toBe(true);
    expect(
      shouldReloadForUpdates(['/src/shared/notifications/welcome.ts']),
    ).toBe(true);
    expect(shouldReloadForUpdates(['/src/styles.css'])).toBe(false);
  });

  it('restricts reloads to user-configured path fragments', () => {
    const watchPaths = ['src/message-templates', 'packages/notifications'];

    expect(
      shouldReloadForUpdates(
        ['/src/message-templates/welcome.tsx'],
        watchPaths,
      ),
    ).toBe(true);
    expect(
      shouldReloadForUpdates(
        ['/packages/notifications/src/reset.tsx'],
        watchPaths,
      ),
    ).toBe(true);
    expect(
      shouldReloadForUpdates(['/src/domains/accounts/profile.tsx'], watchPaths),
    ).toBe(false);
  });

  it('normalizes relative and Windows-style configured paths', () => {
    expect(
      shouldReloadForUpdates(
        ['/src/templates/welcome.tsx'],
        ['.\\src\\templates'],
      ),
    ).toBe(true);
  });
});
