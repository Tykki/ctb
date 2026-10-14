import dotenv from 'dotenv';
import path from 'path';

// Load environmental parameters into memory from the root .env container
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface AppConfig {
  mainnetRpcUrl: string;
  port: number;
}

// Ensure critical paths are structurally present before allocating memory loops
if (!process.env['MAINNET_RPC_URL']) {
  throw new Error('CRITICAL_CONFIG_ERROR: "MAINNET_RPC_URL" parameter missing inside root .env');
}

export const config: AppConfig = {
  mainnetRpcUrl: process.env['MAINNET_RPC_URL'],
  port: process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 8080,
};
