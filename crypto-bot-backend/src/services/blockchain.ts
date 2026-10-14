import { createPublicClient, http, type PublicClient, getAddress } from 'viem';
import { mainnet } from 'viem/chains';

const UNISWAP_V2_PAIR_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: '_reserve0', type: 'uint112' },
      { name: '_reserve1', type: 'uint112' },
      { name: '_blockTimestampLast', type: 'uint32' }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export interface PoolContractTarget {
  id: string;
  dexName: string;
  address: string;
  token0Symbol: string;
  token1Symbol: string;
}

export interface PoolState {
  id: string;
  dexName: string;
  token0Symbol: string;
  token1Symbol: string;
  reserve0: number; // WETH Normalized
  reserve1: number; // USDC Normalized
  address: string;
}

export class BlockchainService {
  private client: PublicClient;

  constructor(rpcUrl: string) {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl),
      pollingInterval: 100,
    });
    console.log(`[BLOCKCHAIN_SERVICE] Optimized JSON-RPC engine client link active.`);
  }

  /**
   * Reads precise token storage slots off-chain safely without gas overhead
   */
  public async getPoolReserves(pool: PoolContractTarget): Promise<PoolState | null> {
    try {
      const checksummedAddress = getAddress(pool.address);

      const data = await this.client.readContract({
        address: checksummedAddress,
        abi: UNISWAP_V2_PAIR_ABI,
        functionName: 'getReserves',
        blockTag: 'latest' // Force execution against the absolute tip of the local mining block state
      });

      const [rawReserve0, rawReserve1] = data;

      /**
       * Contract Token Array Resolution Mapping:
       * - Token0 is USDC (6 Decimals) -> Must divide by 1e6
       * - Token1 is WETH (18 Decimals) -> Must divide by 1e18
       */
      const reserveUsdc = Number(rawReserve0) / 1e6;
      const reserveWeth = Number(rawReserve1) / 1e18;

      return {
        id: pool.id,
        dexName: pool.dexName,
        token0Symbol: pool.token0Symbol, 
        token1Symbol: pool.token1Symbol,
        reserve0: reserveWeth, // Unified format across both pools (WETH as base asset)
        reserve1: reserveUsdc,  // Unified format across both pools (USDC as quote pricing asset)
        address: checksummedAddress
      };
    } catch (error: any) {
      console.error(`❌ [BLOCKCHAIN_SERVICE_ERROR] Failed extraction sequence on ${pool.dexName}:`, error.message);
      return null;
    }
  }
}
