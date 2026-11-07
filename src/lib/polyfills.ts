// Polyfills for Cloudflare Workers (workerd) environment

if (typeof (globalThis as any).WeakRef === "undefined") {
  (globalThis as any).WeakRef = class WeakRef<T extends object> {
    private value: T;
    constructor(value: T) {
      this.value = value;
    }
    deref(): T | undefined {
      return this.value;
    }
  };
}

if (typeof (globalThis as any).FinalizationRegistry === "undefined") {
  (globalThis as any).FinalizationRegistry = class FinalizationRegistry {
    constructor(_cleanupCallback: (heldValue: any) => void) {}
    register(_target: any, _heldValue: any, _unregisterToken?: any) {}
    unregister(_unregisterToken?: any) {}
  };
}

export {};
