import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// 1. Construct a mock object registry container matching browser WebSocket structures
const mockWebSocketInstance = {
  close: vi.fn(),
  onmessage: null as any,
  onclose: null as any,
  onerror: null as any,
};

// Use an instantiable functional class constructor to prevent "not a constructor" errors
function MockWebSocket(url: string) {
  MockWebSocket.calledWithUrl = url;
  MockWebSocket.instances.push(this);
  return mockWebSocketInstance;
}
MockWebSocket.instances = [] as any[];
MockWebSocket.calledWithUrl = '';

global.WebSocket = MockWebSocket as any;

// 2. Setup standard mock responses for Anvil's JSON-RPC 2.0 interface endpoint
global.fetch = vi.fn((url, options) => {
  try {
    const body = JSON.parse((options as any).body);
    
    if (body.method === 'eth_getBalance') {
      return Promise.resolve({
        json: () => Promise.resolve({ result: '0x1bc16d674ec80000' }), // Mock 2 ETH in hexadecimal
      });
    }
    
    if (body.method === 'eth_call') {
      return Promise.resolve({
        json: () => Promise.resolve({ result: '0x0000000000000000000000000000000000000000000000000000000005f5e100' }), // Mock 100 USDC (6 decimals)
      });
    }
  } catch (e) {
    return Promise.reject(new Error('Invalid JSON-RPC request payload'));
  }
  return Promise.reject(new Error('Unknown RPC Method'));
}) as any;

// Import your custom hooks engine module
import { useFlashbotsScanner } from '../useFlashbotsScanner';

describe('useFlashbotsScanner Comprehensive Test Suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    MockWebSocket.instances = [];
    MockWebSocket.calledWithUrl = '';
    mockWebSocketInstance.close.mockClear();
    mockWebSocketInstance.onmessage = null;
    mockWebSocketInstance.onclose = null;
    mockWebSocketInstance.onerror = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with baseline structural states and load Anvil metrics', async () => {
    const { result } = renderHook(() => useFlashbotsScanner());

    // Assert baseline configurations match state registers
    expect(result.current.isScanning).toBe(false);
    expect(result.current.pools).toEqual([]);
    expect(result.current.bundles).toEqual([]);
    expect(result.current.metrics.walletAddress).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

    // Run active microtasks to execute the immediate on-mount fetch call layout sequence
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    // Assert balances align with simulated pricing calculators
    expect(result.current.metrics.ethBalanceNative).toBe(2);
    expect(result.current.metrics.usdcBalanceNative).toBe(100);
    expect(result.current.metrics.totalNetValueUSD).toBe(5300); // (2 * 2600.00) + 100
  });

  it('should not connect to WebSocket on mount if isScanning is false', () => {
    renderHook(() => useFlashbotsScanner());
    expect(MockWebSocket.calledWithUrl).toBe('');
  });

  it('should instantiate WebSocket connection when scanning is turned on', async () => {
    const { result } = renderHook(() => useFlashbotsScanner());

    act(() => {
      result.current.setIsScanning(true);
    });

    expect(MockWebSocket.calledWithUrl).toBe('ws://localhost:8080');
    expect(mockWebSocketInstance.onmessage).toBeTypeOf('function');
    expect(mockWebSocketInstance.onclose).toBeTypeOf('function');
  });

  it('should swallow dropped connections and increment socketRetryTicker past time blocks', async () => {
    const { result } = renderHook(() => useFlashbotsScanner());

    act(() => {
      result.current.setIsScanning(true);
    });

    expect(MockWebSocket.instances.length).toBe(1);

    // Call the close handler function parameter registered on the object layout container
    act(() => {
      mockWebSocketInstance.onclose();
    });

    // Advance fake timers smoothly across your 3000ms delay window
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    // Verify that the ticker increments and tears down/rebuilds a fresh connection loop
    expect(MockWebSocket.instances.length).toBe(2);
  });

  it('should process BUNDLE_UPDATE events and compound totalProfitUSD metrics', async () => {
    const { result } = renderHook(() => useFlashbotsScanner());

    act(() => {
      result.current.setIsScanning(true);
    });

    const sampleEventFrame = {
      data: JSON.stringify({
        event: 'BUNDLE_UPDATE',
        data: {
          status: 'INCLUDED_SUCCESS',
          expectedProfitUSD: 150.50,
          gasPriceGwei: 20
        }
      })
    };

    // Feed message frame packet cleanly to the web socket event pipeline loop
    act(() => {
      mockWebSocketInstance.onmessage(sampleEventFrame);
    });

    expect(result.current.bundles.length).toBe(1);
    expect(result.current.metrics.totalProfitUSD).toBe(150.50);
  });
});
