# Documentation: Blockchain Arbitrage Telemetry Dashboard Frontend

This document outlines the architecture, component implementation details, state lifecycle, and optimization choices for your frontend dashboard. It serves as a technical blueprint for modifying, debugging, or rebuilding the interface.

---

## 🛠️ Code Review & Modern Syntax Compliance

Before mapping individual file assets, here is the architectural review confirming compliance with **2026 enterprise React/TypeScript ecosystem standards**:

1. **Strict Type Imports (`import type`)**: Used across all child UI elements (`PoolRow.tsx`, `BundleRow.tsx`). This signals to the compiler that these items are only used for compilation validation, allowing them to be fully removed from the compiled JavaScript bundle. This reduces memory use and prevents circular reference build loops.
2. **Tailwind CSS v4 Native Integration**: Configured directly through the `@tailwindcss/vite` engine plugin instead of an outdated PostCSS file pipeline. Theme variables are mapped natively using standard CSS variables inside `src/index.css`.
3. **Decoupled Application State Lifecycle**: The application's core data-parsing logic is completely separated from rendering components and placed inside an isolated state machine custom hook (`useFlashbotsScanner.ts`). This structure ensures you can swap your mock simulation code for real, live WebSockets or JSON-RPC provider code down the road without rewriting a single line of your layout components.
4. **Active UI Throttling Performance Protection**: The dashboard updates using pre-sliced data arrays to keep processing costs down. This technique ensures that your browser stays responsive and smooth, even when receiving hundreds of fast state changes per second from active blockchain monitoring pools.

---

## 📂 Architecture Mapping Matrix

```
src/
├── types/
│   └── index.ts                 # Explicit structural data types
├── hooks/
│   └── useFlashbotsScanner.ts   # Core engine tracking & state loop simulation
├── components/
│   ├── MetricCard.tsx           # Aggregated statistics data blocks
│   ├── PoolRow.tsx              # Token liquidity matrix rows
│   └── BundleRow.tsx            # Flashbots transaction execution monitoring cards
├── App.tsx                      # Main structural layout composition grid
├── main.tsx                     # Core entrypoint mounting element
└── index.css                    # Tailwind v4 import asset pipeline
```

---

## 🔬 Component Analysis Deep Dive

### 1. Data Contract Definitions (`src/types/index.ts`)
*   **What it does:** Contains all TypeScript interface structures used by the bot backend scanner and your dashboard layers to enforce reliable data typing.
*   **Why it is critical:** Guarantees that data shapes remain consistent across the app. If a backend property changes or a field name typo occurs, your compiler will flag the issue immediately before deployment.
*   **How it works:** Defines three main data shapes: `LiquidityPool` (for tracking AMM contract pool tokens), `FlashbotsBundleLog` (for tracking the private transaction lifecycle), and `SystemMetrics` (for tracking wallet gains and saved gas).
*   **Debugging Strategy:** If you add new data items to your smart contracts (like tracking a third pool path or transaction logs), update this file first. TypeScript will then highlight exactly which frontend components need to be adjusted to support the new attributes.

### 2. State Controller Engine Hook (`src/hooks/useFlashbotsScanner.ts`)
*   **What it does:** Acts as your localized state machine. It manages tracking toggles, parses asset changes, calculates simulated net yields, and tracks total saved gas metrics.
*   **Why it is critical:** Keeps your logic separated from your views. This lets you mock network operations inside a clean sandbox without mixing network logic into your layout rendering files.
*   **How it works:** Uses standard React state primitives along with an explicit runtime browser reference configuration (`useRef`). The engine timer is mapped inside a reference container to prevent re-render timing issues and avoid duplicate background loops when the tracking switch is toggled.
*   **Debugging Strategy:** Check your state management metrics inside your browser's React Developer Tools plugin. If tracking state updates stall, verify that the `useEffect` cleanup hook is properly resetting the active interval timer ID container whenever the execution engine is toggled off.

### 3. Component Layer: Statistics Tracker (`src/components/MetricCard.tsx`)
*   **What it does:** Accepts a text label string, a value string, and an optional CSS style rule to render a statistics card.
*   **Why it is critical:** Avoids layout code repetition across your stats panels. It groups consistent element structures together to keep code tidy.
*   **How it works:** A stateless functional component (`React.FC`). It parses properties dynamically and injects dynamic strings into its classes using standard Tailwind styles.
*   **Debugging Strategy:** If numbers blow out your text boundaries, make sure to add standard layout truncation utility classes (like `truncate` or `overflow-hidden`) directly to the base element wrapper.

### 4. Component Layer: Liquidity Matrix Row (`src/components/PoolRow.tsx`)
*   **What it does:** Formats raw token balance numbers into readable numbers with correct decimals for each monitored automated market maker (AMM) contract.
*   **Why it is critical:** Displays deep liquidity variations in real time, making it easy to spot where token values are shifting between pools.
*   **How it works:** Accepts a typed `LiquidityPool` data object. It formats large numbers dynamically using standard JavaScript locale format utilities (`toLocaleString`), ensuring numbers display clearly with consistent decimal points.
*   **Debugging Strategy:** If numbers render as `NaN`, verify that your incoming data payload parses the liquidity figures as actual numeric values rather than raw unparsed strings.

### 5. Component Layer: Flashbots Transaction Ledger (`src/components/BundleRow.tsx`)
*   **What it does:** Displays the state lifecycle of transactions routed through the Flashbots private network relay, coloring rows clearly based on transaction events.
*   **Why it is critical:** Simulates monitoring private transactions. It tracks when bundles are safely skipped due to lack of profit (`DROPPED_UNPROFITABLE`) or successfully executed into a block (`INCLUDED_SUCCESS`).
*   **How it works:** Maps key state values to a clear CSS lookup layout object. This changes border colors and backgrounds instantly without adding messy logic blocks directly inside your layout markup code.
*   **Debugging Strategy:** If status background colors mismatch your transaction values, verify that the key string returned by your endpoint maps exactly to one of the three states defined in your styles lookup template object.

### 6. Main Workspace Layout (`src/App.tsx`)
*   **What it does:** Orchestrates your entire dashboard view, laying out component sections onto a responsive grid container.
*   **Why it is critical:** Manages layout rules across the app. It handles positioning elements cleanly for all device types, from wide screens to mobile interfaces.
*   **How it works:** Imports the engine state tracking hooks, maps stats metrics to data modules, and renders lists of liquidity rows and bundle statuses cleanly.
*   **Debugging Strategy:** If layout elements overlap, look for missing layout wrapping elements or mismatched responsive breakpoint prefixes (like `sm:`, `md:`, or `lg:`) inside the parent grid configuration tags.

---

## 🧪 Frontend Test Architecture & Verification Logic

Our validation framework utilizes **Vitest** paired with **React Testing Library** to verify user interfaces without requiring full browser builds.

### Testing Core Principles
1. **Isolated Component Testing**: Test files must render single components independently from parent containers by passing explicit props manually.
2. **DOM Assertions**: Use explicit test query selectors (like `screen.getByText`) to confirm layout text mirrors the data contracts exactly.
3. **No Database Dependencies**: The tests use zero actual database queries or external network requests. They use static data objects to ensure your test suite runs instantly.

### How to Run and Troubleshoot Tests
Execute your test suite locally by running:
```bash
npx vitest run
```
*   **If a test fails on structural values:** Check whether a formatting utility (such as `toFixed`) inside your code is altering your numbers differently than the plain text string expected by your test assertion.
*   **If a component fails to render during a test:** Verify that all required component properties have been explicitly passed to the test environment builder wrapper function.

---

## 🛠️ Step-by-Step Reconstruction Guide

If you ever need to rebuild this system from scratch without copy-pasting code, follow this structured execution order:

1. **Setup Scaffolding:** Create a blank Vite template using the React TypeScript option, then install your core icons library (`lucide-react`).
2. **Define Data Shapes first:** Write your `types/index.ts` structures to set up clear data specifications before building your layouts.
3. **Build Individual Layout Elements:** Write your isolated UI elements (`MetricCard`, `PoolRow`, `BundleRow`) as simple display blocks that accept static mock values.
4. **Implement the State Engine Hook:** Create your custom hook state machine, adding an interval loop to verify that properties flow down and re-render components correctly.
5. **Add Layout Rules:** Wrap your components in responsive CSS grids within `App.tsx` to handle alignment cleanly across screen sizes.
6. **Write Unit Tests:** Add your test assertions last to confirm that future code adjustments won't break your existing layout structure.
