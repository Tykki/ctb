import React from 'react';
import type { FlashbotsBundleLog } from '../types';

interface BundleRowProps {
  bundle: FlashbotsBundleLog;
}

export const BundleRow: React.FC<BundleRowProps> = ({ bundle }) => {
  const statusStyles = {
    PENDING: 'bg-amber-950/40 text-amber-400 border-amber-900',
    INCLUDED_SUCCESS: 'bg-emerald-950/40 text-emerald-400 border-emerald-900',
    DROPPED_UNPROFITABLE: 'bg-neutral-800/60 text-neutral-400 border-neutral-700'
  };

  return (
    <div className="p-3 bg-neutral-950 border border-neutral-900 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-neutral-300">Bundle {bundle.bundleHash}</span>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusStyles[bundle.status]}`}>
            {bundle.status.replace('_', ' ')}
          </span>
        </div>
        <div className="text-[10px] text-neutral-500">
          Target: {bundle.targetPoolA} ➔ {bundle.targetPoolB} | {bundle.gasPriceGwei} GWEI
        </div>
      </div>
      <div className="text-left sm:text-right">
        <span className={`font-black text-sm block ${bundle.status === 'INCLUDED_SUCCESS' ? 'text-emerald-400' : 'text-neutral-500'}`}>
          {bundle.status === 'INCLUDED_SUCCESS' ? '+' : ''}\${bundle.expectedProfitUSD.toFixed(2)}
        </span>
        <span className="text-[9px] text-neutral-600 block">{new Date(bundle.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
