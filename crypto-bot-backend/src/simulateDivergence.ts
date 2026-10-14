import { createWalletClient, http, publicActions, parseUnits } from 'viem';
import { mainnet } from 'viem/chains';

/**
 * 🐋 PRODUCTION WHALE SIMULATOR:
 * Instead of hacking storage registers, we impersonate a real, top-tier multi-million dollar 
 * exchange vault already holding massive liquidity on the active block height.
 */
const BINANCE_USDC_VAULT = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
const SUSHISWAP_ROUTER_V2 = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

const ERC20_ABI = [
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' }
] as const;

const ROUTER_ABI = [
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

async function executeWhaleMarketCrash() {
  console.log('🐋 [WHALE_SIMULATOR] Initializing real-world market distortion sequence...');

  const baseClient = createWalletClient({
    chain: mainnet,
    transport: http('http://127.0.0.1:8545')
  }).extend(publicActions);

  try {
    // 1. Uncap permissions to impersonate the massive Binance funding pool
    await baseClient.request({
      method: 'anvil_impersonateAccount',
      params: [BINANCE_USDC_VAULT]
    });

    // 2. Format a massive, realistic market order (\$3,500,000.00 USDC dump)
    const dumpAmountRaw = parseUnits('3500000', 6);

    // 3. Grant approval permissions to the router
    const approveTx = await baseClient.writeContract({
      account: BINANCE_USDC_VAULT,
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [SUSHISWAP_ROUTER_V2, dumpAmountRaw]
    });
    await baseClient.waitForTransactionReceipt({ hash: approveTx });
    console.log('   -> Liquidity allocation permissions granted securely.');

    // 4. Execute a massive swap order that crashes the Sushiswap pool price organically
    console.log('🚀 [WHALE_SIMULATOR] Broadcasting a \$3.5M market-sell order into Sushiswap rails...');
    const swapTx = await baseClient.writeContract({
      account: BINANCE_USDC_VAULT,
      address: SUSHISWAP_ROUTER_V2,
      abi: ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [
        dumpAmountRaw,
        0n, // Set slippage to zero to force the block to process and tank the price profile
        [USDC_ADDRESS, WETH_ADDRESS],
        BINANCE_USDC_VAULT,
        BigInt(Math.floor(Date.now() / 1000) + 300)
      ],
      gas: 300000n
    });

    await baseClient.waitForTransactionReceipt({ hash: swapTx });
    
    // Force Anvil to seal the block and propagate changes over the network
    await baseClient.request({ method: 'evm_mine', params: [] });
    console.log(`✅ [WHALE_SIMULATOR] Market order successfully settled into block! Hash: ${swapTx}`);

    // Lock the vault account back down to preserve environment hygiene
    await baseClient.request({
      method: 'anvil_stopImpersonatingAccount',
      params: [BINANCE_USDC_VAULT]
    });

  } catch (err: unknown) {
    if (err instanceof Error) console.error('❌ [WHALE_SIMULATOR_CRITICAL_FAILURE]', err.message);
  }
}

executeWhaleMarketCrash();
