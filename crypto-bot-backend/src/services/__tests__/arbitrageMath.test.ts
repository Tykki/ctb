import { describe, it, expect, beforeEach } from 'vitest';
import { ArbitrageMathEngine } from '../arbitrageMath.js';
import type { PoolState } from '../blockchain.js';

describe('ArbitrageMathEngine Unit Testing Suite', () => {
  let mathEngine: ArbitrageMathEngine;

  beforeEach(() => {
    mathEngine = new ArbitrageMathEngine();
  });

  it('correctly filters out and drops tight unprofitable spreads', () => {
    // Both pools perfectly balanced at $2,500 per ETH
    const mockUniPool: PoolState = {
      id: '1', dexName: 'Uniswap V2', token0Symbol: 'WETH', token1Symbol: 'USDC',
      reserve0: 1000, reserve1: 2500000, address: '0x1'
    };
    const mockSushiPool: PoolState = {
      id: '2', dexName: 'Sushiswap', token0Symbol: 'WETH', token1Symbol: 'USDC',
      reserve0: 1000, reserve1: 2500000, address: '0x2'
    };

    const calculation = mathEngine.calculateCrossPoolSpread(mockUniPool, mockSushiPool);
    
    expect(calculation.direction).toBe('NONE');
    expect(calculation.shouldTrade).toBe(false);
    expect(calculation.expectedNetProfitUSD).toBe(0);
  });

  it('identifies and accepts highly profitable cross-pool arbitrage deltas', () => {
    // Uniswap ETH price: $2,000 | Sushiswap ETH price: $3,000 (Massive 50% discrepancy)
    const cheapUniPool: PoolState = {
      id: '1', dexName: 'Uniswap V2', token0Symbol: 'WETH', token1Symbol: 'USDC',
      reserve0: 1000, reserve1: 2000000, address: '0x1'
    };
    const premiumSushiPool: PoolState = {
      id: '2', dexName: 'Sushiswap', token0Symbol: 'WETH', token1Symbol: 'USDC',
      reserve0: 1000, reserve1: 3000000, address: '0x2'
    };

    const calculation = mathEngine.calculateCrossPoolSpread(cheapUniPool, premiumSushiPool);
    
    expect(calculation.direction).toBe('UNI_TO_SUSHI');
    expect(calculation.shouldTrade).toBe(true);
    expect(calculation.expectedNetProfitUSD).toBeGreaterThan(100); // Nets solid margins
  });
});
