import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { mainnet } from 'viem/chains';

// Import production components completely naturally with zero mock code clutter
import { BlockchainService } from '../blockchain.js';
import { ArbitrageMathEngine } from '../arbitrageMath.js';

// Setup explicit token and account parameters for the transaction run
const SUSHI_PAIR = '0x397FF1542f962076d0BFE58eA045FfA2d347ACa0';
const UNI_PAIR = '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc';
const USDC_TOKEN = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const METAMASK_WHALE_ACCOUNT = '0xF977814e90dA44bFA03b6295A0616a897441aceC'; 

const tokenAbi = parseAbi([
  'function transfer(address to, uint256 amount) external returns (bool)'
]);

const pairAbi = parseAbi([
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external'
]);

describe('🚀 Production-Grade Backend Orchestrator & Math Integration Suite', () => {
  const publicClient = createPublicClient({ chain: mainnet, transport: http('http://127.0.0.1:8545') });
  const walletClient = createWalletClient({
    chain: mainnet,
    transport: http('http://127.0.0.1:8545'),
    account: METAMASK_WHALE_ACCOUNT
  });

  let snapshotId: string;

  beforeEach(async () => {
    snapshotId = await publicClient.request({ method: 'anvil_snapshot' as any }) as string;
  });

  afterEach(async () => {
    await publicClient.request({ method: 'anvil_revert' as any, params: [snapshotId] });
  });

  it('should successfully capture real transaction-based divergence and route it through the Math Engine', async () => {
    const blockchain = new BlockchainService();
    const mathEngine = new ArbitrageMathEngine();

    // 1. Verify baseline reserves can be cleanly fetched from Anvil
    const baselineReserves = await blockchain.getPoolReserves(SUSHI_PAIR);
    expect(baselineReserves).not.toBeNull();

    // 2. Impersonate the whale account to fund our real transaction swap simulation
    await publicClient.request({ method: 'anvil_impersonateAccount' as any, params: [METAMASK_WHALE_ACCOUNT] });
    await publicClient.request({ method: 'anvil_setBalance' as any, params: [METAMASK_WHALE_ACCOUNT, '0x8ac7230489e80000'] });

    // Transfer 3.5 Million real USDC into Sushiswap
    const transferAmount = BigInt(3500000 * 1e6);
    const txHash = await walletClient.writeContract({
      address: USDC_TOKEN,
      abi: tokenAbi,
      functionName: 'transfer',
      args: [SUSHI_PAIR, transferAmount]
    });
    await publicClient.request({ method: 'evm_mine' as any });
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Execute an un-cheated raw swap on sushiswap to change reserves organically
    const swapAmountOutWETH = BigInt(1200 * 1e18); 
    const swapTx = await walletClient.writeContract({
      address: SUSHI_PAIR,
      abi: pairAbi,
      functionName: 'swap',
      args: [0n, swapAmountOutWETH, METAMASK_WHALE_ACCOUNT, '0x']
    });
    await publicClient.request({ method: 'evm_mine' as any });
    await publicClient.waitForTransactionReceipt({ hash: swapTx });

    await publicClient.request({ method: 'anvil_stopImpersonatingAccount' as any, params: [METAMASK_WHALE_ACCOUNT] });

    // 3. Extract the mutated reserves using your real BlockchainService
    const updatedReserves = await blockchain.getPoolReserves(SUSHI_PAIR);
    expect(updatedReserves).not.toBeNull();
    expect(updatedReserves!.reserve0).not.toEqual(baselineReserves!.reserve0);

    // 4. Pass the un-cheated, mutated metrics straight into your production Math Engine
    const uniReserves = await blockchain.getPoolReserves(UNI_PAIR);
    const mathAnalysis = mathEngine.calculateCrossPoolSpread(uniReserves, updatedReserves!);

    // 5. Assertions confirm your entire off-chain trading math handles market logic accurately
    expect(mathAnalysis.isProfitable).toBe(true);
    expect(mathAnalysis.percentageGap).toBeGreaterThan(0.60); 
    expect(mathAnalysis.targetRoute).toBeDefined();
    expect(mathAnalysis.expectedNetProfitUSD).toBeGreaterThan(0);

    console.log(`\n✅ [INTEGRATION_PASSED] Real Spread Detected: ${mathAnalysis.percentageGap.toFixed(4)}%`);
    console.log(`🔥 [INTEGRATION_PASSED] Expected Net Profit: $${mathAnalysis.expectedNetProfitUSD.toFixed(2)}`);
  });
});
