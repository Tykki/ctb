// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IBalancerVault {
    /**
     * @notice Requests an upfront flash loan of tokens with zero required collateral.
     * @param recipient The address receiving the tokens (this will be your contract)
     * @param tokens An array of token addresses you want to borrow
     * @param amounts An array of exact token amounts matching the token order array
     * @param userData Encoded configuration parameters passed forward to your execution callback function
     */
    function flashLoan(
        address recipient,
        address[] calldata tokens,
        uint256[] calldata amounts,
        bytes calldata userData
    ) external;
}
