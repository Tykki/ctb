import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Natively inject environment configurations system-wide before any imports evaluate
    env: {
      MAINNET_RPC_URL: 'http://127.0.0.1:8545',
      UNISWAP_PAIR_ADDRESS: '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc',
      SUSHISWAP_PAIR_ADDRESS: '0x397FF1542f962076d0BFE58eA045FfA2d347ACa0',
      BALANCER_VAULT_ADDRESS: '0xBA12222222228d8Ba445958a75a0704d566BF2C8'
    },
    globals: true,
    isolate: true
  }
});
