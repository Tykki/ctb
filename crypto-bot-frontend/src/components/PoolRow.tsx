import React from 'react';
import type { LiquidityPool } from '../types';

interface PoolRowProps {
  pool: LiquidityPool;
}

export const PoolRow: React.FC<PoolRowProps> = ({ pool }) => {
  return (
    <div className="p-3 bg-neutral-900 border border-neutral-800 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">{pool.dexName}</span>
          <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono">{pool.address}</span>
        </div>
        <div className="text-[10px] text-neutral-500 mt-1">Token Pair: {pool.token0Symbol} / {pool.token1Symbol}</div>
      </div>
      <div className="text-left sm:text-right font-mono space-y-0.5">
        <div className="text-neutral-400"><span className="text-neutral-500">Res0:</span> {pool.reserve0.toFixed(2)}</div>
        <div className="text-neutral-400"><span className="text-neutral-500">Res1:</span> {pool.reserve1.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
      </div>
    </div>
  );
};
