import { describe, expect, it, vi } from 'vitest';
import { viteSourceUpdates } from './vite';

describe('viteSourceUpdates', () => {
  it('is safe outside Vite', () => {
    const onUpdate = vi.fn();

    expect(() =>
      viteSourceUpdates(undefined).subscribe(onUpdate)(),
    ).not.toThrow();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('notifies after matching Vite updates and unsubscribes', () => {
    let listener:
      | ((payload: { updates: Array<{ path: string }> }) => void)
      | undefined;
    const hot = {
      on: vi.fn((_event, nextListener) => {
        listener = nextListener;
      }),
      off: vi.fn(),
    };
    const onUpdate = vi.fn();
    const unsubscribe = viteSourceUpdates(hot, {
      watchPaths: ['src/emails'],
    }).subscribe(onUpdate);

    listener?.({ updates: [{ path: '/src/pages/home.tsx' }] });
    listener?.({ updates: [{ path: '/src/emails/welcome.tsx' }] });
    unsubscribe();

    expect(onUpdate).toHaveBeenCalledOnce();
    expect(hot.off).toHaveBeenCalledWith('vite:afterUpdate', listener);
  });
});
