import type { SourceUpdates } from '../core/types';
import { shouldReloadForUpdates } from '../core/watch';

type ViteUpdatePayload = { updates: Array<{ path: string }> };
type ViteHotContext = {
  on: (
    event: 'vite:afterUpdate',
    listener: (payload: ViteUpdatePayload) => void,
  ) => void;
  off: (
    event: 'vite:afterUpdate',
    listener: (payload: ViteUpdatePayload) => void,
  ) => void;
};

export const viteSourceUpdates = (
  hot: ViteHotContext | undefined,
  options: { watchPaths?: string[] } = {},
): SourceUpdates => ({
  subscribe(onUpdate) {
    if (!hot) return () => {};
    const afterUpdate = (payload: ViteUpdatePayload) => {
      if (
        shouldReloadForUpdates(
          payload.updates.map((update) => update.path),
          options.watchPaths,
        )
      ) {
        onUpdate();
      }
    };
    hot.on('vite:afterUpdate', afterUpdate);
    return () => hot.off('vite:afterUpdate', afterUpdate);
  },
});
