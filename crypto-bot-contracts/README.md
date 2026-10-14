# 📕 MEV Flashbots Arbitrage Engine — Smart Contract Manual

This manual details the architecture, configuration boundaries, cross-pool routing logic, and deployment workflows implemented within the Solidity smart contract layer using the Foundry framework.

---

## ⚡ 2026 Enterprise Quality & Security Standards

The smart contract layer adheres to modern, institutional smart contract engineering conventions:
1. **Solidity v0.8.26 Strict Baseline Constraints**: Utilizes native overflow/underflow checking out-of-the-box, ensuring numerical calculations fail gracefully without vulnerable external libraries.
2. **Intermediate Representation Optimization (`via_ir = true`)**: Bypasses the strict EVM 16-slot stack depth limitation by converting Solidity structures into highly optimized Yul structural representations prior to compilation.
3. **Linter-Driven Security Safeguards**: Explicitly satisfies static code analysis rules by rejecting execution patterns involving unchecked ERC-20 transfers or lacking empty-address validation guards against `address(0)`.

---

## 📁 Smart Contract Codebase Structure
crypto-bot-contracts/
├── foundry.toml               # Central compiler and optimization configurations
├── remappings.txt            # Package shorthand mapping references
├── script/
│   └── DeployFlashArbitrageur.s.sol # Automated deployment routing workflow script
└── src/
├── FlashArbitrageur.sol   # Core atomic trade manager proxy contract
└── interfaces/
├── IBalancerVault.sol # Flash loan provider data selector definitions
├── IERC20.sol         # Token utility method interface definitions
└── IUniswapV2Pair.sol # AMM pool storage layout interface definitions

---

## ⚙️ Module Blueprint Manual & Deep Dive

### 1. Unified Interface Matrix (`src/interfaces/`)

#### What it does
Provides structural blueprints defining the function naming patterns, visibility restrictions, and parameter boundaries of external on-chain applications. It contains three critical modules:
*   **`IERC20.sol`**: Regulates tracking balances (`balanceOf`) and shifting assets (`transfer`).
*   **`IUniswapV2Pair.sol`**: Regulates extracting liquidity metrics (`getReserves`) and triggering low-level pool execution vectors (`swap`).
*   **`IBalancerVault.sol`**: Connects directly to the Balancer V2 multi-token pool infrastructure to initiate capital flash loans.

#### Why it is critical
The Ethereum Virtual Machine (EVM) operates strictly on low-level binary data. Interfaces generate the precise 4-byte cryptographic function selectors required to communicate across separate contracts.

#### How it works
When your core contract calls an interface method, it encodes the method parameter types into an explicit call data payload. For example: `IUniswapV2Pair(pool).getReserves()` maps directly to the compiled bytecode selector footprint `0x0902f1ac`.

#### Debugging & Troubleshooting Strategy
*   **Common Error**: `Compiler error: Identifier already declared`
*   **Fix**: This occurs if an interface is declared inside the local file block while also being imported via a header command. Isolate all interfaces to their own standalone files in the `interfaces/` subfolder.
*   **Return Mismatch Exception**: `Expected '{' but got 'address'`
*   **Fix**: Ensure your interface function visibility strictly uses the modern syntax `returns (address)` instead of appending the token type modifier sequentially.

---

### 2. Core Operational Agent (`src/FlashArbitrageur.sol`)

#### What it does
Acts as the secure on-chain proxy that swallows borrowed capital, chains multi-pool swaps together, verifies net profits, and moves profits to your wallet in a single atomic transaction.

#### Why it is critical
**Bypasses traditional slow public router middleware.** Interacting directly with low-level AMM pair storage slots cuts your transaction gas overhead in half, allowing your bot to remain highly competitive and process trades under tight layout execution constraints.

#### How it works
The execution sequence moves concurrently through four logical steps:
1.  **`executeArbitrageTrade`**: Triggered off-chain by your TypeScript backend bot. It formats parameters into a byte array and contacts the Balancer Vault.
2.  **`receiveFlashLoan`**: The secure callback function invoked automatically by Balancer once it pushes the cash. It runs an administrative sender verification guard to confirm the request originated from the true Balancer Vault.
3.  **Local Memory Scope Block `{}`**: Transfers the borrowed tokens directly into the Uniswap V2 pool contract address (`poolA`), executes a low-level `.swap()` that moves intermediate assets straight into the Sushiswap pool address (`poolB`), and runs a second `.swap()` withdrawing final returns back into this contract.
4.  **Slippage Verification Guard**: Evaluates whether `endingBalance - totalRepaymentAmount` meets or exceeds your bot's target `minProfit`. If true, it returns the capital to Balancer and skims net profits to your wallet. If short by a single penny, it forces a transaction `revert`.

#### Debugging & Troubleshooting Strategy
*   **Common Error**: `Compiler error: Stack too deep`
*   **Fix**: The EVM stack cannot pass more than 16 slots. Wrap your trading logic cleanly inside a local memory scope bracket `{}` to instruct the compiler to discard temporary array storage pointers the second they exit scope. Additionally, ensure `via_ir = true` is active inside your settings.
*   **Linter Flag**: `warning[unused-return]: return value of an external call is not used`
*   **Fix**: Capture all parameters returned by pool tuples explicitly (such as `blockTimestampLast` inside the reserve reader loop) and feed them to an anonymous placeholder signature `_` to clean compiling outputs.

---

### 3. Automated Script Deployer (`script/DeployFlashArbitrageur.s.sol`)

#### What it does
Automates the compilation checks and signing constraints needed to instantiate your core contract bytecode onto any active blockchain node.

#### Why it is critical
Eliminates the need for complex external Javascript or Python deployment framework setups, running your deployment sequence using raw Solidity scripts natively.

#### How it works
Utilizes Foundry's special `forge-std` environment testing hooks (`vm.startBroadcast`). It loads an execution private key from your machine's terminal context, packages your compiled smart contract constructor parameters, broadcasts the transaction to your local JSON-RPC gateway port, and returns your checksummed contract address.

#### Debugging & Troubleshooting Strategy
*   **Common Error**: `EvmError: OutOfGas` or silent mempool hangs during script broadcast.
*   **Fix**: Verify your local running Anvil node is active. If your deployment private key lacks local gas funds, execute an `anvil_setBalance` cheat code to fund your deployment account prior to driving script allocations.

---

## 🏗️ Step-by-Step Contract Reconstruction Guide

If you need to move or rebuild this entire smart contract infrastructure inside another project repository folder, use this configuration checklist:

1.  **Initialize the Environment Workspace**: Run `forge init --no-commit` inside a fresh terminal directory.
2.  **Configure Optimization Paths**: Open your `foundry.toml` and manually inject `via_ir = true` along with high-level optimization parameters (`optimizer = true`, `runs = 200`).
3.  **Map out Data Blueprints**: Establish your contract property templates inside the `src/interfaces/` subfolder using strict `returns (...)` visibility layout configurations.
4.  **Scaffold Entrypoint Parameters**: Declare your highly typed data storage contracts (`ArbitragePayload`) to match your backend scanner arrays.
5.  **Write Memory Scope Barriers**: Insert local variable scope blocks `{}` inside your flash loan callback function to optimize EVM memory allocations.
6.  **Secure Administrative Paths**: Implement the `onlyOwner` modifier constraints on your emergency asset collection function (`recoverERC20Token`).
7.  **Compile & Launch**: Build the structural bytecode using `forge build`, then launch the automated broadcast pipeline using `forge script`.

---

### 🛠️ Manual File Setup Instructions

To load this blueprint directly into your local codebase, follow these steps:
1. Open a terminal tab inside your **`crypto-bot-contracts`** repository root directory.
2. Generate a clean file: `touch README.md`.
3. Open the file in your preferred editor (e.g., VS Code), copy the raw markdown text block above, and save it directly into the file.

# Sends an explicit RPC command instructing Anvil to completely wipe its state and refork cleanly
curl -H "Content-Type: application/json" -X POST --data '{"jsonrpc":"2.0","method":"anvil_reset","params":[],"id":1}' http://127.0.0.1:8545