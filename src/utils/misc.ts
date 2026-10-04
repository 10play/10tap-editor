export const isFabric = (): boolean =>
  !!(globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager;
