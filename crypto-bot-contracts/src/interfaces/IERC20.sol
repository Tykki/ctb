// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC20 {
    // Returns the amount of tokens owned by an account address
    function balanceOf(address account) external view returns (uint256);

    // Moves tokens from your contract straight to a recipient address
    function transfer(address to, uint256 amount) external returns (bool);

    // Approves an external contract (like a DEX) to spend a specific amount of your tokens
    function approve(address spender, uint256 amount) external returns (bool);

    // Moves tokens from a sender to a recipient (used when interacting with routers/vaults)
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
