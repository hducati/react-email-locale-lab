const SCRIPT_MODULE = /\.[cm]?[jt]sx?(?:\?|$)/;

const normalizePath = (path: string) => path.replaceAll('\\', '/').replace(/^\.\//, '');

export const shouldReloadForUpdates = (updatePaths: string[], watchPaths?: string[]) => {
  const normalizedUpdates = updatePaths.map(normalizePath);
  const normalizedWatchPaths = watchPaths?.map(normalizePath).filter(Boolean);

  if (!normalizedWatchPaths?.length) {
    return normalizedUpdates.some((path) => SCRIPT_MODULE.test(path));
  }

  return normalizedUpdates.some((path) =>
    normalizedWatchPaths.some((watchPath) => path.includes(watchPath)),
  );
};
