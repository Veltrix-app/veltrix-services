import { syncOnchainProvider } from "../core/aesp/provider-sync.js";

type SyncOnchainProviderJobInput = {
  projectId?: string | null;
  limit?: number;
  maxBlocks?: number;
};

export async function runOnchainProviderSyncJob(input: SyncOnchainProviderJobInput = {}) {
  return syncOnchainProvider(input);
}
