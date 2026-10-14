export interface LiquidityPool {
  id: string;
  dexName: string;
  token0Symbol: string;
  token1Symbol: string;
  reserve0: number;
  reserve1: number;
  address: string;
}

export interface FlashbotsBundleLog {
  id: string;
  timestamp: number;
  targetPoolA: string;
  targetPoolB: string;
  expectedProfitUSD: number;
  gasPriceGwei: number;
  // Flashbots status path: PENDING -> INCLUDED (Profit) OR DROPPED (No cost)
  status: 'PENDING' | 'INCLUDED_SUCCESS' | 'DROPPED_UNPROFITABLE';
  bundleHash: string;
}

export interface SystemMetrics {
  walletAddress: string;
  totalNetValueUSD: number;    // Consolidated global portfolio value
  ethBalanceNative: number;    // Raw ETH gas runway allocation
  ethBalanceUSD: number;       // ETH value scaled to dollars
  usdcBalanceNative: number;   // Accumulated take-home trading profits
  totalProfitUSD: number;      // Historical performance matrix tracker
  activePoolCount: number;
  gasSavedUSD: number; // Tracker for money saved by dropping unprofitable bundles off-chain
 
}
