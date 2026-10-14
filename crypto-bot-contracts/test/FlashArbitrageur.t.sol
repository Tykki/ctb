// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { Test } from "forge-std/Test.sol";
import { FlashArbitrageur, ArbitragePayload } from "../src/FlashArbitrageur.sol";

/**
 * @title FlashArbitrageurTest
 * @notice Advanced unit and integration testing suite for on-chain arbitrage vectors.
 */
contract FlashArbitrageurTest is Test {
    FlashArbitrageur public arbitrageur;
    
    // Mainnet Contract Address References
    address constant BALANCER_VAULT = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    address constant UNISWAP_V2_POOL = 0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc;
    address constant SUSHISWAP_POOL = 0x397FF1542f962076d0BFE58eA045FfA2d347ACa0;
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    function setUp() public {
        // Fork Mainnet state locally for deterministic test stability
        // Correct local development setup: point directly to your active mining Anvil process
        // vm.createSelectFork("http://127.0.0.1:8545");

         /**
         * FIX: We nest the fork selection execution hook directly inside the roll parameter block.
         * This bypasses explicit local identifier variable declarations entirely, avoiding variable
         * parsing anomalies while safely forcing our active local Anvil background node back to a 
         * pristine block height (20854320) where reserves are completely clean.
         */
        vm.rollFork(vm.createSelectFork("http://127.0.0.1:8545"), 20854320);
        
        // Instantiate the execution contract
        arbitrageur = new FlashArbitrageur();
    }

    /**
     * @notice Unit Test: Enforces strict administrative role boundaries.
     */
    function test_OnlyOwnerRestriction() public {
        ArbitragePayload memory mockPlan = ArbitragePayload({
            poolA: UNISWAP_V2_POOL,
            poolB: SUSHISWAP_POOL,
            tokenIn: USDC,
            tokenOut: WETH,
            amountIn: 10000 * 1e6, // $10,000 USDC
            minProfit: 100 * 1e6   // $100 minimum target
        });

        // Change sender identity to a random unprivileged address
        vm.prank(address(0xDEADBEEF));
        
        // Assert that the contract securely reverts the execution call
        vm.expectRevert("ERROR: UNAUTHORIZED_SENDER_IDENTITY");
        arbitrageur.executeArbitrageTrade(mockPlan);
    }

    /**
     * @notice Integration Test: Asserts the slippage guard forces an atomic rollback on a bad trade.
     */
    function test_ArbitrageRevertsOnUnprofitableSpread() public {
        ArbitragePayload memory unprofitablePlan = ArbitragePayload({
            poolA: UNISWAP_V2_POOL,
            poolB: SUSHISWAP_POOL,
            tokenIn: USDC,
            tokenOut: WETH,
            amountIn: 50000 * 1e6, // Borrow $50,000 USDC
            minProfit: 500 * 1e6   // Demand a $500 profit
        });

        // Simulate a call coming from the official Balancer Vault callback framework
        address[] memory tokens = new address[](1);
        tokens[0] = USDC;
        
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = unprofitablePlan.amountIn;
        
        uint256[] memory fees = new uint256[](1);
        fees[0] = 0; // Balancer V2 has 0% flash loan fees

        bytes memory packedData = abi.encode(unprofitablePlan);

        /**
         * 1. FIX: HYDRO-FAUCET CHEATCODE DATA INJECTION
         * We call 'deal' to instantly write the borrowed token allocations into the contract's 
         * storage footprint prior to triggering the callback function. This ensures that the swap step succeeds
         * and the code safely reaches our downstream profit validation logic block.
         */
        deal(USDC, address(arbitrageur), unprofitablePlan.amountIn);

        // Expect the contract to abort processing because active market rates won't hit the profit minimum
        vm.prank(BALANCER_VAULT);
        // Instruct the test suite that we expect an explicit slippage guard abort on the next execution line
        vm.expectRevert("ERROR: SLIPPAGE_SLOT_REVERT_UNPROFITABLE_DELTA");
        arbitrageur.receiveFlashLoan(tokens, amounts, fees, packedData);
    }
}
