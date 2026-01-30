import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Mock ResizeObserver for tests
globalThis.ResizeObserver = class ResizeObserver {
  observe(): void { }
  unobserve(): void { }
  disconnect(): void { }
};
