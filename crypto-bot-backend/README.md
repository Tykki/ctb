# Architecture & Technical Documentation: Arbitrage Engine Backend

This technical manual details the architecture, design principles, mathematical models, and operational pipelines of the **Blockchain Arbitrage Service Layer (Backend)**. It completes the documentation suite for your local sandbox setup.

## ⚡ 2026 Enterprise Quality & Performance Standards

The backend codebase utilizes standard Node.js development workflows:

* **ESM and NodeNext Module Resolution (`.js` imports):** Complies with ECMAScript Modules (ESM) using strict `NodeNext` file resolutions. All internal source-relative file imports must include an explicit `.js` extension to resolve paths under modern runtime restrictions.
* **Deterministic Pre-flight Verification:** Contract addresses are checked via low-level bytecode extraction (`getCode`) before execution. Mismatched block parameters or empty storage pointers return clean logs instead of breaking runtime channels.
* **BigInt to Number Normalization:** On-chain numbers are processed as BigInt integers to prevent decimal precision errors. Values are normalized using decimal multipliers (`1e18` for WETH, `1e6` for USDC) before passing to calculation layers.

---

## 📁 Backend Codebase Structure

```text
crypto-bot-backend/
├── .env                           # Isolated environment configuration
├── package.json                   # Runtime dependency configurations
├── tsconfig.json                  # Strict TypeScript compilation parameters
└── src/
    ├── index.ts                   # Central operational entrypoint orchestration
    ├── config/
    │   └── index.ts               # Environment variable initialization & validation
    └── services/
        ├── arbitrageMath.ts       # Off-chain spread calculation engine
        ├── blockchain.ts          # Optimized JSON-RPC node client wrapper via viem
        ├── socketServer.ts        # Standalone broadcast WebSocket infrastructure
        └── __tests__/
            └── arbitragePipeline.test.ts # Unified Vitest integration suite
```

---

## ⚙️ Module Blueprint Manual & Deep Dive

### 1. Environment Configurations (`.env` & `src/config/index.ts`)

* **What it does:** Loads environmental keys and API parameters from disk storage directly into process memory layout contexts.
* **Why it is critical:** Isolates network provider keys and secret credentials away from execution modules, preventing keys from being accidentally bundled or exposed.
* **How it works:** The configuration loader pulls `process.env` properties at startup using `dotenv`. It uses strict error boundaries: if `MAINNET_RPC_URL` is empty, it throws an initialization exception and shuts down the process immediately.
* **Debugging & Reconstruction:** 
  * *Common Error:* `CRITICAL_CONFIG_ERROR: "MAINNET_RPC_URL" parameter missing...`
  * *Fix:* Verify your `.env` file exists at the root of `crypto-bot-backend`, that its filename includes the leading dot, and that the key name exactly matches the expected parameter string.

### 2. Standalone Broadcast Server (`src/services/socketServer.ts`)

* **What it does:** Initializes and maintains an independent networking port to manage client connections and pipe live telemetry data to your React frontend.
* **Why it is critical:** Bypasses Vite's internal development socket channels completely. This prevents client interface reloads from dropping your background logging data pipelines.
* **How it works:** The module starts a standard `WebSocketServer` instance using the `ws` package. It tracks active web clients inside a type-safe `Set<WebSocket>` collection. When the core application calls `.broadcast()`, the server translates the data array into a clean JSON string frame and distributes it concurrently to every open connection slot.
* **Debugging & Reconstruction:**
  * *Common Error:* `Error: listen EADDRINUSE: address already in use :::8080`
  * *Fix:* Another service is using port 8080. Change the port parameter in your `.env` file to a clean option (e.g., `PORT=8082`) and restart your terminal.

### 3. EVM Node Interface (`src/services/blockchain.ts`)

* **What it does:** Connects your local project backend directly to your running Foundry Anvil network via high-speed JSON-RPC calls.
* **Why it is critical:** Acts as your data ingestion pipeline. It reads raw contract storage slots off-chain free of any gas fees, fetching precise token balances stored within public liquidity contracts.
* **How it works:** The service builds an optimized public reading client using the `viem` package. It pulls data frames using two main functions:
  * `client.getCode`: A pre-flight safety check. It ensures that the target address contains actual smart contract code on the current block before attempting to read data.
  * `client.readContract`: Calls the public `getReserves()` function defined by the constant product pool's smart contract binary interface (ABI).
* **Debugging & Reconstruction:**
  * *Common Error:* `returned no data ("0x")`
  * *Fix:* This means the address contains zero contract bytecode on your current block height. Ensure your Anvil terminal node is completely synced with an active mainnet fork URL.

### 4. Off-Chain Math Calculator (`src/services/arbitrageMath.ts`)

* **What it does:** Computes real-time price paths and slippage variances off-chain using the Constant Product Formula: x ⋅ y = k.
* **Why it is critical:** Saves gas money. Running math checks on a live blockchain costs real money for transaction computational steps. This module ensures you only broadcast a transaction when a trade is guaranteed to be net profitable.
* **How it works:** The engine takes pool reserve parameters and calculates implicit spot prices by dividing asset balances (USDC ÷ WETH). It detects price imbalances, calculates the spread percentage, and matches it against a strict fee overhead barrier:
  \[\text{Minimum Required Gap} = \text{TAKER\_FEE\_LOOPS} \times 2 \times 100 = 0.60\%\]
  If the gap is wide enough to cover pool swap fees, it factors in transaction gas overhead to ensure your final take-home net return is positive.
* **Debugging & Reconstruction:**
  * *Common Error:* Spreads fail to trigger even when prices look different.
  * *Fix:* Review the raw checkpoint data logs in your terminal. Mismatched token decimal adjustments or small capital allocations relative to gas costs can cause your net profit calculation to fall below zero, filtering out the trade safely.

### 5. Central System Orchestrator (`src/index.ts`)

* **What it does:** The master controller that links all your independent services together into a continuous data pipeline loop.
* **Why it is critical:** Manages the application lifecycle. It reads active block states, drives the math modules, packages opportunities into data frames, and catches operating system kill signals to release network ports cleanly on exit.
* **How it works:** Starts a recurring background interval timer that triggers every second. It orchestrates a three-step cycle:
  1. Triggers `Promise.all` to query both Uniswap and Sushiswap pool configurations concurrently.
  2. Formats the data and broadcasts it over the socket to sync your UI charts.
  3. Passes the results to the math engine to find trades. If a profitable path opens up, it signs it as an active trade payload (`BUNDLE_UPDATE`) and pushes it straight to the frontend log ledger.
* **Debugging & Reconstruction:**
  * *Common Error:* Pipeline loops execute but data metrics fail to sync or update on screen.
  * *Fix:* Ensure your event identifier text strings match exactly between your backend emitter and your frontend websocket listener hooks (`POOL_UPDATE` and `BUNDLE_UPDATE`).

---

## 🧪 Integration Verification Framework

The integration suite uses **Vitest** to run automated simulation pipelines without spin-up delays or gas costs:

```typescript
// Core operational mechanism found inside src/services/__tests__/arbitragePipeline.test.ts
const manipulatedStorageHex = '0x00000000000000d3c21bcecceda100000000000000000000000000746a528800';

await baseClient.request({
  method: 'anvil_setStorageAt' as any,
  params: [checksummedSushiPool, '0x8', manipulatedStorageHex]
});

await baseClient.request({ method: 'evm_mine' as any });
```

### Why This Testing Method is Reliable
* **`anvil_setStorageAt`:** Modifies the contract's storage slots directly in memory. This skips the wallet balance limits and transfer permissions that can stall traditional testing scripts.
* **`evm_mine`:** Forces Anvil to clear its virtual mempool and immediately produce a block containing the artificial storage changes.

## Local code for testing
TEST=anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/alch_oK5SGirOrQQQSKr2zTs26 --block-time 12