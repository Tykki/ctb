import type { PoolState } from './blockchain.js';

export interface ArbitrageExecutionPlan {
  shouldTrade: boolean;
  direction: 'UNI_TO_SUSHI' | 'SUSHI_TO_UNI' | 'NONE';
  optimalAmountInUSD: number;
  expectedGrossProfitUSD: number;
  expectedNetProfitUSD: number;
}

export class ArbitrageMathEngine {
  private readonly TAKER_FEE_LOOPS = 0.003; // 0.3% Pool Fee
  private readonly ESTIMATED_ROUNDTRIP_GAS_USD = 18.50;

  public calculateCrossPoolSpread(uniPool: PoolState, sushiPool: PoolState): ArbitrageExecutionPlan {
    const priceUniswap = uniPool.reserve1 / uniPool.reserve0;
    const priceSushiswap = sushiPool.reserve1 / sushiPool.reserve0;

    console.log(`\n🔍 [CHECKPOINT 2A: MATH_ENGINE_INPUTS]`);
    console.log(`   -> Calculated Spot Prices | Uniswap Price: \$${priceUniswap.toFixed(2)} | Sushiswap Price: \$${priceSushiswap.toFixed(2)}`);

    let direction: 'UNI_TO_SUSHI' | 'SUSHI_TO_UNI' | 'NONE' = 'NONE';
    let spreadUSD = 0;

    if (priceUniswap < priceSushiswap) {
      direction = 'UNI_TO_SUSHI';
      spreadUSD = priceSushiswap - priceUniswap;
    } else if (priceSushiswap < priceUniswap) {
      direction = 'SUSHI_TO_UNI';
      spreadUSD = priceUniswap - priceSushiswap;
    }

    const pricePercentageGap = (spreadUSD / Math.min(priceUniswap, priceSushiswap)) * 100;
    console.log(`   -> Spread Analysis | Raw Delta: \$${spreadUSD.toFixed(2)} | Percentage Gap: ${pricePercentageGap.toFixed(4)}%`);

    // Minimum gap threshold constraint checkpoint logic
    const minimumRequiredGap = this.TAKER_FEE_LOOPS * 2 * 100; // 0.60%
    if (spreadUSD <= 0 || pricePercentageGap < minimumRequiredGap) {
      console.log(`   ❌ [CHECKPOINT 2B: THRESHOLD_FAILED] Spread (${pricePercentageGap.toFixed(2)}%) is lower than minimum fee overhead requirements (${minimumRequiredGap.toFixed(2)}%). Filtering out trade allocation route.`);
      return { shouldTrade: false, direction: 'NONE', optimalAmountInUSD: 0, expectedGrossProfitUSD: 0, expectedNetProfitUSD: 0 };
    }

    const fixedTradeSizeUSD = 1000;
    const feeMultiplier = 1 - this.TAKER_FEE_LOOPS;
    const expectedGrossProfitUSD = fixedTradeSizeUSD * (pricePercentageGap / 100) * feeMultiplier * feeMultiplier;
    const expectedNetProfitUSD = expectedGrossProfitUSD - this.ESTIMATED_ROUNDTRIP_GAS_USD;

    console.log(`   ✅ [CHECKPOINT 2C: THRESHOLD_PASSED] Profitable price delta identified. Gross: \$${expectedGrossProfitUSD.toFixed(2)} | Net: \$${expectedNetProfitUSD.toFixed(2)}`);

    return {
      shouldTrade: expectedNetProfitUSD > 0,
      direction,
      optimalAmountInUSD: fixedTradeSizeUSD,
      expectedGrossProfitUSD,
      expectedNetProfitUSD
    };
  }
}
