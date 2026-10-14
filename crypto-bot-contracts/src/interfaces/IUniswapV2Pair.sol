// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IUniswapV2Pair {
    // Returns the official contract address of the pool's Token 0
    function token0() external view returns (address);

    // Returns the official contract address of the pool's Token 1
    function token1() external view returns (address);

    /**
     * @notice Returns the current asset balances stored inside the pool contract.
     * @return _reserve0 The pool balance of Token 0
     * @return _reserve1 The pool balance of Token 1
     * @return _blockTimestampLast The timestamp of the last block interaction
     */
    function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast);

    /**
     * @notice Low-level execution hook to swap tokens.
     * @param amount0Out Total amount of Token 0 you are withdrawing from the pool
     * @param amount1Out Total amount of Token 1 you are withdrawing from the pool
     * @param to The recipient address receiving the withdrawn tokens
     * @param data Arbitrary byte data payload. Leaving this blank signals a standard swap.
     */
    function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
}