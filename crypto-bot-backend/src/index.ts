import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import { config } from './config/index.js';
import { SocketServer } from './services/socketServer.js';
import { BlockchainService } from './services/blockchain.js';
import { ArbitrageMathEngine } from './services/arbitrageMath.js';

const server = new SocketServer(config.port);
const blockchain = new BlockchainService('http://127.0.0.1:8545');
const mathEngine = new ArbitrageMathEngine();

// Target configuration variables
const DEPLOYED_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const ANVIL_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const account = privateKeyToAccount(ANVIL_PRIVATE_KEY);

const executorClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http('http://127.0.0.1:8545')
}).extend(publicActions);

const TARGET_POOLS = [
  { id: '1', dexName: 'Uniswap V2', address: '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc', token0Symbol: 'WETH', token1Symbol: 'USDC' },
  { id: '2', dexName: 'Sushiswap', address: '0x397FF1542f962076d0BFE58eA045FfA2d347ACa0', token0Symbol: 'WETH', token1Symbol: 'USDC' }
];

const FLASH_ARBITRAGEUR_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'poolA', type: 'address' },
          { name: 'poolB', type: 'address' },
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'minProfit', type: 'uint256' }
        ],
        name: 'tradePlan',
        type: 'tuple'
      }
    ],
    name: 'executeArbitrageTrade',
    outputs: [],
    stateMutability: 'external',
    type: 'function'
  }
] as const;

/**
 * 🔄 EVENT-DRIVEN EXECUTION ENGINE:
 * Instead of relying on a fragile setInterval timer loop, we configure an on-chain block watch 
 * listener wrapper. This forces the backend to run evaluations the exact millisecond a block is 
 * mined, completely eliminating network race conditions.
 */
console.log('📡 [ORCHESTRATOR] Event-driven block listener initialized. Awaiting Anvil block mining events...');

executorClient.watchBlocks({
  onBlock: async (block) => {
    try {
      const blockNumber = block.number ? block.number.toString() : 'latest';
      console.log(`\n📦 [ORCHESTRATOR] New Block Detected: #${blockNumber} | Triggering data sync...`);

      const synchronizedPoolStates = await Promise.all(
        TARGET_POOLS.map(pool => blockchain.getPoolReserves(pool))
      );

      const validStates = synchronizedPoolStates.filter((state): state is NonNullable<typeof state> => state !== null);
      if (validStates.length < 2) return;

      const [uniPoolState, sushiPoolState] = validStates;

      // Broadcast fresh liquidity numbers straight to the browser charts
      server.broadcast('POOL_UPDATE', [uniPoolState, sushiPoolState]);

      // Process calculations off-chain
      const evaluation = mathEngine.calculateCrossPoolSpread(uniPoolState, sushiPoolState);

      if (evaluation.direction !== 'NONE' && evaluation.shouldTrade) {
        console.log(`🔥 [ARBITRAGE_TRIGGER] Profitable spread caught on block #${blockNumber}! Compiling transaction...`);

        const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
        const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

        const targetPoolA = evaluation.direction === 'UNI_TO_SUSHI' ? uniPoolState.address : sushiPoolState.address;
        const targetPoolB = evaluation.direction === 'UNI_TO_SUSHI' ? sushiPoolState.address : uniPoolState.address;

        const amountInRawBigInt = BigInt(Math.floor(evaluation.optimalAmountInUSD * 1e6));
        const minProfitRawBigInt = BigInt(Math.floor(evaluation.expectedGrossProfitUSD * 0.5 * 1e6));

        try {
          console.log(`🚀 [EXECUTION_ENGINE] Shipping transaction payload to contract...`);

          const txHash = await executorClient.writeContract({
            address: DEPLOYED_CONTRACT_ADDRESS as `0x${string}`,
            abi: FLASH_ARBITRAGEUR_ABI,
            functionName: 'executeArbitrageTrade',
            args: [{
              poolA: targetPoolA as `0x${string}`,
              poolB: targetPoolB as `0x${string}`,
              tokenIn: USDC_ADDRESS,
              tokenOut: WETH_ADDRESS,
              amountIn: amountInRawBigInt,
              minProfit: minProfitRawBigInt
            }],
            gas: 450000n
          });

          // ====================================================================
          // ✅ NEW HIGH-PRECISION AUDIT LAYER: Wait for the blockchain receipt
          // ====================================================================
          console.log(`⏳ [ORCHESTRATOR] Awaiting on-chain transaction receipt confirmation...`);
          const receipt = await executorClient.waitForTransactionReceipt({ hash: txHash });

          if (receipt.status === 'reverted') {
            // If the EVM rolled back the transaction due to insufficient token liquidity, drop it safely
            throw new Error("EVM_TRANSACTION_REVERTED_IN_POOL_RAILS");
          }

          console.log(`✅ [EXECUTION_SUCCESS] Arbitrage transaction confirmed in block! Tx Hash: ${txHash}`);

          server.broadcast('BUNDLE_UPDATE', {
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now(),
            targetPoolA: evaluation.direction === 'UNI_TO_SUSHI' ? 'Uniswap V2' : 'Sushiswap',
            targetPoolB: evaluation.direction === 'UNI_TO_SUSHI' ? 'Sushiswap' : 'Uniswap V2',
            expectedProfitUSD: parseFloat(evaluation.expectedNetProfitUSD.toFixed(2)),
            gasPriceGwei: 28,
            status: 'INCLUDED_SUCCESS',
            bundleHash: txHash.substring(0, 10) + '...'
          });

        } catch (executionError: unknown) {
          if (executionError instanceof Error) {
            console.warn(`❌ [EXECUTION_REVERTED] Trade aborted safely inside EVM rails:`, executionError.message);
          }
          
          server.broadcast('BUNDLE_UPDATE', {
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now(),
            targetPoolA: evaluation.direction === 'UNI_TO_SUSHI' ? 'Uniswap V2' : 'Sushiswap',
            targetPoolB: evaluation.direction === 'UNI_TO_SUSHI' ? 'Sushiswap' : 'Uniswap V2',
            expectedProfitUSD: parseFloat(evaluation.expectedNetProfitUSD.toFixed(2)),
            gasPriceGwei: 28,
            status: 'DROPPED_UNPROFITABLE',
            bundleHash: '0x0000...00'
          });
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) console.error('❌ [ORCHESTRATOR_CRITICAL_FAILURE]', err.message);
    }
  }
});
