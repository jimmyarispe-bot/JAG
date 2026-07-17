"use server";

import {
  execPause,
  execReconnect,
  execResume,
  execRetry,
  execSyncNow,
} from "@/lib/exec/load-integrations";

export async function syncIntegrationAction(instanceId: string) {
  return execSyncNow(instanceId);
}

export async function reconnectIntegrationAction(instanceId: string) {
  return execReconnect(instanceId);
}

export async function pauseIntegrationAction(instanceId: string) {
  return execPause(instanceId);
}

export async function resumeIntegrationAction(instanceId: string) {
  return execResume(instanceId);
}

export async function retryIntegrationAction(instanceId: string) {
  return execRetry(instanceId);
}
