// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BundleRow } from '../BundleRow';
import type { FlashbotsBundleLog } from '../../types';
import React from 'react';

describe('BundleRow Interactive Rendering Component Test Suite', () => {
  it('correctly compiles and renders an INCLUDED_SUCCESS transaction payload frame', () => {
    const mockSuccessBundle: FlashbotsBundleLog = {
      id: 'test-99',
      timestamp: Date.now(),
      targetPoolA: 'Uniswap V2',
      targetPoolB: 'Sushiswap',
      expectedProfitUSD: 145.50,
      gasPriceGwei: 35,
      status: 'INCLUDED_SUCCESS',
      bundleHash: '0x7a2f...1b'
    };

    render(<BundleRow bundle={mockSuccessBundle} />);

    // FIX: Using regular expressions (delimited by /.../) completely bypasses the literal backslash constraint
    expect(screen.getByText(/Bundle\s+0x7a2f\.\.\.1b/)).toBeDefined();
    expect(screen.getByText(/145\.50/)).toBeDefined();
    
    // Validate custom conditional styling attributes are present
    const statusPill = screen.getByText(/INCLUDED\s+SUCCESS/i);
    expect(statusPill.className).toContain('text-emerald-400');
  });

  it('correctly handles styles for a privately DROPPED_UNPROFITABLE simulation frame', () => {
    const mockDroppedBundle: FlashbotsBundleLog = {
      id: 'test-100',
      timestamp: Date.now(),
      targetPoolA: 'Uniswap V2',
      targetPoolB: 'Sushiswap',
      expectedProfitUSD: 12.00,
      gasPriceGwei: 22,
      status: 'DROPPED_UNPROFITABLE',
      bundleHash: '0x9e1b...4c'
    };

    render(<BundleRow bundle={mockDroppedBundle} />);

    expect(screen.getByText(/Bundle\s+0x9e1b\.\.\.4c/)).toBeDefined();
    
    const statusPill = screen.getByText(/DROPPED\s+UNPROFITABLE/i);
    expect(statusPill.className).toContain('text-neutral-400');
  });
});
