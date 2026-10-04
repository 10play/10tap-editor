import { useEffect, useState, type RefObject } from 'react';
import { findNodeHandle } from 'react-native';

type NodeHandleSource = Parameters<typeof findNodeHandle>[0];

/**
 * @deprecated Unused since the custom keyboard moved into the app's React
 * tree, and `findNodeHandle` is deprecated in the New Architecture. Kept for code
 * that deep-imports it; will be removed in 2.0.
 */
export const useRefHandle = (compRef: RefObject<unknown>) => {
  const [handle, setHandle] = useState<number | undefined>();

  useEffect(() => {
    if (compRef.current) {
      const reactTag = findNodeHandle(compRef.current as NodeHandleSource);
      setHandle(reactTag || undefined);
    }
  }, [compRef]);

  return handle;
};
