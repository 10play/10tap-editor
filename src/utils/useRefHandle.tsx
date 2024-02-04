import { useEffect, useState, type RefObject } from 'react';
import { findNodeHandle } from 'react-native';

export const useRefHandle = (compRef: RefObject<any>) => {
  const [handle, setHandle] = useState<number | undefined>();

  useEffect(() => {
    if (compRef.current) {
      const reactTag = findNodeHandle(compRef.current);
      setHandle(reactTag || undefined);
    }
  }, [compRef]);

  return handle;
};
