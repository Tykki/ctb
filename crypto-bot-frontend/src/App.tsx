import React from 'react';
import { useFlashbotsScanner } from './hooks/useFlashbotsScanner';

export default function App() {
  const { pools, bundles, metrics, isScanning, setIsScanning } = useFlashbotsScanner();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-black text-white font-mono min-h-screen">
      
      {/* 📡 SECTION 1: SYSTEM OPERATION GATEWAY HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <h1 className="text-xl font-black tracking-tight text-neutral-100 flex items-center gap-2">
            🤖 AUTOMATED MEV ARBITRAGE STATION
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Operator Private Key Profile Account: 
            <span className="text-neutral-300 ml-2 select-all bg-neutral-950 px-2 py-0.5 rounded border border-neutral-900">
              {metrics.walletAddress}
            </span>
          </p>
        </div>
        <button
          onClick={() => setIsScanning(!isScanning)}
          className={`px-4 py-2.5 rounded text-xs font-bold transition-all border shadow-sm ${
            isScanning 
              ? 'bg-red-950/30 text-red-400 border-red-900/60 hover:bg-red-900/40' 
              : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/60 hover:bg-emerald-900/40'
          }`}
        >
          {isScanning ? '🛑 TERMINATE BOT BACKGROUND AGENTS' : '⚡ ENGAGE CORE MONITORING LOOPS'}
        </button>
      </div>

      {/* 📊 SECTION 2: DECOUPLED MULTI-ASSET LEDGER MATRIX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Unified Net Worth Portfolio Balance */}
        <div className="p-4 bg-neutral-950 border border-neutral-900 rounded space-y-1">
          <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">Total Portfolio Balance</span>
          <span className="text-xl font-black text-neutral-100 block">
            \${metrics.totalNetValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Native Ethereum Balance Inventory Allocation */}
        <div className="p-4 bg-neutral-950 border border-neutral-900 rounded space-y-1">
          <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">Native ETH Capital Asset</span>
          <span className="text-xl font-black text-blue-400 block">
            {metrics.ethBalanceNative.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ETH
          </span>
          <span className="text-[10px] text-neutral-600 block">
            \${metrics.ethBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD Allocation
          </span>
        </div>

        {/* Accumulated USDC Arbitrage Capital Revenue Inventory */}
        <div className="p-4 bg-neutral-950 border border-neutral-900 rounded space-y-1">
          <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">USDC Revenue Inventory</span>
          <span className="text-xl font-black text-amber-500 block">
            {metrics.usdcBalanceNative.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
          </span>
          <span className="text-[10px] text-neutral-600 block">Skimmed Arbitrage Settlement Gains</span>
        </div>

        {/* System Performance Tracker Matrix */}
        <div className="p-4 bg-neutral-950 border border-neutral-900 rounded space-y-1">
          <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">Session Realized Profit</span>
          <span className="text-xl font-black text-emerald-400 block">
            +\${metrics.totalProfitUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-neutral-600 block">
            Shielded Gas Saved: <span className="text-neutral-400">\${metrics.gasSavedUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
        </div>
      </div>

      {/* 🔄 SECTION 3: REAL-TIME CROSS-POOL LIQUIDITY RADAR */}
      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-neutral-400 font-bold">📡 Active On-Chain Liquidity Targets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pools.length === 0 ? (
            <div className="md:col-span-2 p-6 bg-neutral-950/40 border border-neutral-900 rounded text-center text-neutral-600 text-xs">
              Awaiting data ingestion loops. Engage the monitor button to link into the WebSockets.
            </div>
          ) : (
            pools.map((pool) => (
              <div key={pool.id} className="p-4 bg-neutral-950 border border-neutral-900 rounded space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <span className="text-sm font-black text-neutral-300">{pool.dexName} Target Pool</span>
                  <span className="text-[10px] text-neutral-600 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                    {pool.address.substring(0, 8)}...{pool.address.substring(34)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-500 uppercase block font-bold">{pool.token0Symbol} Reserve Pool</span>
                    <span className="font-bold text-neutral-300">
                      {pool.reserve0.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-500 uppercase block font-bold">{pool.token1Symbol} Reserve Pool</span>
                    <span className="font-bold text-neutral-300">
                      {pool.reserve1.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-neutral-600 font-bold uppercase">
                    <span>Implicit Spot Price</span>
                    <span className="text-neutral-400">
                      \${(pool.reserve1 / pool.reserve0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ETH
                    </span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1 rounded overflow-hidden">
                    <div 
                      className="bg-neutral-700 h-1 rounded transition-all duration-300"
                      style={{ width: `${Math.min(Math.max((pool.reserve0 / (pool.reserve0 + (pool.reserve1 / 2600))) * 100, 10), 90)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* 📜 SECTION 4: PRIVATE BUNDLE TRANSCRIPT TRANSACTION LOGS */}
      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-neutral-400 font-bold">📜 Real-Time Flashbots Bundle Ledger</h2>
        <div className="bg-neutral-950 border border-neutral-900 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-900 bg-neutral-950 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  <th className="p-3">Bundle Registry ID / Hash</th>
                  <th className="p-3">Routing Pathway Trace</th>
                  <th className="p-3 text-right">Target Delta Net profit</th>
                  <th className="p-3 text-right">Priority Base Fee</th>
                  <th className="p-3 text-right">Mempool Pipeline Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {bundles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-neutral-600 text-xs font-mono">
                      No active arbitrage bundle block execution rows recorded for this testing session.
                    </td>
                  </tr>
                ) : (
                  bundles.map((bundle) => (
                    <tr key={bundle.id} className="hover:bg-neutral-900/30 transition-colors">
                      <td className="p-3 font-bold text-neutral-300">
                        <span className="text-neutral-600 mr-2">[{new Date(bundle.timestamp).toLocaleTimeString()}]</span>
                        Bundle {bundle.bundleHash}
                      </td>
                      <td className="p-3 text-neutral-400">
                        {bundle.targetPoolA} <span className="text-neutral-600 mx-1">➔</span> {bundle.targetPoolB}
                      </td>
                      <td className={`p-3 text-right font-black ${bundle.status === 'INCLUDED_SUCCESS' ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {bundle.status === 'INCLUDED_SUCCESS' ? '+' : ''}\${bundle.expectedProfitUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right text-neutral-500 font-bold">
                        {bundle.gasPriceGwei} GWEI
                      </td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          bundle.status === 'INCLUDED_SUCCESS'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900'
                            : 'bg-neutral-900/60 text-neutral-500 border-neutral-800'
                        }`}>
                          {bundle.status === 'INCLUDED_SUCCESS' ? 'INCLUDED SUCCESS' : 'DROPPED UNPROFITABLE'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
