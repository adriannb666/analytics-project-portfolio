import { dexMonitor } from '@/functions/dexMonitor';

export async function validateConnection(payload) {
  const r = await dexMonitor({ action: 'validate', ...payload });
  return r.data;
}

export async function syncConnection(connection_id) {
  const r = await dexMonitor({ action: 'sync', connection_id });
  return r.data;
}

export async function listLighterAccounts(wallet_address) {
  const r = await dexMonitor({ action: 'list_lighter_accounts', wallet_address });
  return r.data;
}