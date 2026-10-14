import { useState, useEffect } from 'react';
import type { LiquidityPool, FlashbotsBundleLog, SystemMetrics } from '../types';

export function useFlashbotsScanner() {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [bundles, setBundles] = useState<FlashbotsBundleLog[]>([]);
  
  // 1. A clean state ticker to handle automated network re-connections naturally
  const [socketRetryTicker, setSocketRetryTicker] = useState<number>(0);

  // Production UI Core State Register Container
  const [metrics, setMetrics] = useState<SystemMetrics>({
    walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Anvil Account #0
    totalNetValueUSD: 0.00,
    ethBalanceNative: 0.00,
    ethBalanceUSD: 0.00,
    usdcBalanceNative: 0.00,
    totalProfitUSD: 0.00,
    gasSavedUSD: 0.00,
    activePoolCount: 2
  });

   useEffect(() => {
    /**
     * EXTENSIBLE ASSET INDEX CONFIGURATION:
     * To track new tokens (e.g. USDT) in the future, simply add its contract 
     * address and decimal scalar properties right into this schema map object array.
     */
    const ASSET_REGISTRY = {
      USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    };

    const syncAnvilMultiAssetWallet = async () => {
      try {
        // --- ASSET 1: QUERY NATIVE ETHEREUM (GAS RUNWAY) ---
        const ethResponse = await fetch('http://127.0.0.1:8545', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', method: 'eth_getBalance', params: [metrics.walletAddress, 'latest'], id: 1
          })
        });
        const ethPayload = await ethResponse.json();
        const rawEthWei = BigInt(ethPayload.result || '0x0');
        const nativeEthAmount = Number(rawEthWei) / 1e18;
        
        const ETH_SPOT_PRICE_MODEL = 2600.00; // Simulated benchmark calculation scalar
        const computedEthUSD = nativeEthAmount * ETH_SPOT_PRICE_MODEL;

        // --- ASSET 2: QUERY ERC-20 TOKENS (USDC ARBITRAGE PROFITS) ---
        // Generates the standard ERC-20 'balanceOf(address)' 4-byte selector (0x70a08231)
        const callDataPayload = `0x70a08231000000000000000000000000${metrics.walletAddress.substring(2)}`;
        
        const usdcResponse = await fetch('http://127.0.0.1:8545', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{ to: ASSET_REGISTRY.USDC.address, data: callDataPayload }, 'latest'],
            id: 2
          })
        });
        const usdcPayload = await usdcResponse.json();
        const rawUsdcHex = usdcPayload.result && usdcPayload.result !== '0x' ? usdcPayload.result : '0x0';
        const nativeUsdcAmount = Number(BigInt(rawUsdcHex)) / Math.pow(10, ASSET_REGISTRY.USDC.decimals);

        // --- CONSOLIDATION PHASE ---
        const calculatedNetWorth = computedEthUSD + nativeUsdcAmount; // Because USDC is a stablecoin, 1 USDC = \$1.00

        setMetrics(prev => ({
          ...prev,
          ethBalanceNative: parseFloat(nativeEthAmount.toFixed(4)),
          ethBalanceUSD: parseFloat(computedEthUSD.toFixed(2)),
          usdcBalanceNative: parseFloat(nativeUsdcAmount.toFixed(2)),
          totalNetValueUSD: parseFloat(calculatedNetWorth.toFixed(2))
        }));

      } catch (err) {
        console.warn('[FRONTEND_WALLET_SYNC_WARN] Anvil local port connection dropped.');
      }
    };

    syncAnvilMultiAssetWallet();
    const corePollingHeartbeat = setInterval(syncAnvilMultiAssetWallet, 5000);
    return () => clearInterval(corePollingHeartbeat);
  }, [metrics.walletAddress]);

  /**
   * 2. Live WebSocket Event Data Ingestion Gateway
   * CLEAN RE-CONNECTION LOOP
   * By adding 'socketRetryTicker' to the dependency array, this hook cleanly 
   * teardowns old socket memory allocations and spins up a pristine connection
   * whenever the node backend restarts, maintaining complete architectural safety.
   */
  useEffect(() => {
    if (!isScanning) return;

    const socket = new WebSocket('ws://localhost:8080');

    socket.onmessage = (event) => {
      try {
        const rawFrame = JSON.parse(event.data);
        if (rawFrame.event === 'POOL_UPDATE') setPools(rawFrame.data);
        if (rawFrame.event === 'BUNDLE_UPDATE') {
          const newBundle = rawFrame.data;
          setBundles(prev => [newBundle, ...prev].slice(0, 30));
          if (newBundle.status === 'INCLUDED_SUCCESS') {
            setMetrics(m => ({
              ...m,
              totalProfitUSD: parseFloat((m.totalProfitUSD + newBundle.expectedProfitUSD).toFixed(2))
            }));
          } else if (newBundle.status === 'DROPPED_UNPROFITABLE') {
            const estimatedGasUsed = 350000;
            const savedWei = BigInt(estimatedGasUsed) * BigInt(newBundle.gasPriceGwei * 1e9);
            const savedUSDValue = (Number(savedWei) / 1e18) * 2600.00;
            setMetrics(m => ({ ...m, gasSavedUSD: parseFloat((m.gasSavedUSD + savedUSDValue).toFixed(2)) }));
          }
        }
      } catch (err) { console.error(err); }
    };

    // REACTIVE TRIGGER: If the socket closes, increment the ticker to force a clean, un-nested loop rebuild
    socket.onclose = () => {
      console.warn('[FRONTEND_SOCKET] Connection dropped. Re-triggering stream link...');
      setTimeout(() => setSocketRetryTicker(prev => prev + 1), 3000);
    };

    socket.onerror = () => socket.close();

    return () => socket.close();
  }, [isScanning, socketRetryTicker]); // Clean, explicit dependency declarations

  return { isScanning, setIsScanning, pools, bundles, metrics };
}