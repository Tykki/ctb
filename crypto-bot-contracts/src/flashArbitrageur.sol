// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { IERC20 } from "./interfaces/IERC20.sol";
import { IUniswapV2Pair } from "./interfaces/IUniswapV2Pair.sol";
import { IBalancerVault } from "./interfaces/IBalancerVault.sol";

struct ArbitragePayload {
    address poolA;       
    address poolB;       
    address tokenIn;     
    address tokenOut;    
    uint256 amountIn;    
    uint256 minProfit;   
}

contract FlashArbitrageur {
    address public immutable owner;
    address public constant BALANCER_VAULT = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;

    modifier onlyOwner() {
        require(msg.sender == owner, "ERROR: UNAUTHORIZED_SENDER_IDENTITY");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function executeArbitrageTrade(ArbitragePayload calldata tradePlan) external onlyOwner {
        address[] memory tokens = new address[](1);
        tokens[0] = tradePlan.tokenIn;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = tradePlan.amountIn;

        bytes memory dataPayload = abi.encode(tradePlan);

        IBalancerVault(BALANCER_VAULT).flashLoan(
            address(this),
            tokens,
            amounts,
            dataPayload
        );
    }

    function receiveFlashLoan(
        address[] calldata tokens,
        uint256[] calldata amounts,
        uint256[] calldata feeAmounts,
        bytes calldata userData
    ) external {
        require(msg.sender == BALANCER_VAULT, "ERROR: INVALID_CALLBACK_SENDER");

        ArbitragePayload memory plan = abi.decode(userData, (ArbitragePayload));
        uint256 initialBalance = IERC20(plan.tokenIn).balanceOf(address(this));

        // 1. STACK OPTIMIZATION: Isolate the swap sequence within an independent memory scope bracket.
        // This instructs the EVM to instantly free up stack variables the millisecond the block exits.
        {
            require(IERC20(plan.tokenIn).transfer(plan.poolA, plan.amountIn), "ERROR: POOL_A_FUND_FAILED");

            uint256 amount0OutPoolA = plan.tokenOut < plan.tokenIn ? getExpectedAmountOut(plan.poolA, plan.tokenIn, plan.amountIn) : 0;
            uint256 amount1OutPoolA = plan.tokenOut > plan.tokenIn ? getExpectedAmountOut(plan.poolA, plan.tokenIn, plan.amountIn) : 0;
            uint256 intermediateAssetAmount = amount0OutPoolA > 0 ? amount0OutPoolA : amount1OutPoolA;

            IUniswapV2Pair(plan.poolA).swap(amount0OutPoolA, amount1OutPoolA, plan.poolB, new bytes(0));

            uint256 amount0OutPoolB = plan.tokenIn < plan.tokenOut ? getExpectedAmountOut(plan.poolB, plan.tokenOut, intermediateAssetAmount) : 0;
            uint256 amount1OutPoolB = plan.tokenIn > plan.tokenOut ? getExpectedAmountOut(plan.poolB, plan.tokenOut, intermediateAssetAmount) : 0;

            IUniswapV2Pair(plan.poolB).swap(amount0OutPoolB, amount1OutPoolB, address(this), new bytes(0));
        }

        // 2. PROFIT VERIFICATION
        uint256 endingBalance = IERC20(plan.tokenIn).balanceOf(address(this));
        uint256 grossProfit = endingBalance > initialBalance ? endingBalance - initialBalance : 0;
        
        uint256 totalRepaymentAmount = amounts[0] + feeAmounts[0];
        uint256 netProfit = grossProfit > totalRepaymentAmount ? grossProfit - totalRepaymentAmount : 0;

        require(netProfit >= plan.minProfit && netProfit > 0, "ERROR: SLIPPAGE_SLOT_REVERT_UNPROFITABLE_DELTA");

        // Repay the Balancer Flash Loan principal
        require(IERC20(tokens[0]).transfer(BALANCER_VAULT, totalRepaymentAmount), "ERROR: FLASH_LOAN_REPAY_FAILED");

        // Skim the remaining net take-home arbitrage gains straight into your private owner wallet
        uint256 netTakeHomeGains = IERC20(plan.tokenIn).balanceOf(address(this));
        require(IERC20(plan.tokenIn).transfer(owner, netTakeHomeGains), "ERROR: PROFIT_DISTRIBUTION_FAILED");
    }

    function getExpectedAmountOut(address pool, address tokenIn, uint256 amountIn) internal view returns (uint256 amountOut) {
        (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast) = IUniswapV2Pair(pool).getReserves();
        
        // Silence the unused variable linter check for the timestamp placeholder
        blockTimestampLast;

        (uint256 reserveIn, uint256 reserveOut) = tokenIn == IUniswapV2Pair(pool).token0() 
            ? (uint256(reserve0), uint256(reserve1)) 
            : (uint256(reserve1), uint256(reserve0));
        
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function recoverERC20Token(address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "ERROR: INVALID_TARGET_TOKEN_ADDRESS");
        uint256 contractBalance = IERC20(tokenAddress).balanceOf(address(this));
        require(contractBalance > 0, "ERROR: ZERO_BALANCE_AVAILABLE");
        require(IERC20(tokenAddress).transfer(owner, contractBalance), "ERROR: ASSET_TRANSFER_FAILED");
    }
}
