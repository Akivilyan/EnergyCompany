import type { GameClient } from "./gameClientEntry.js";

type GameClientMountListener = (client: GameClient) => void;

let mountedClient: GameClient | null = null;
const mountListeners = new Set<GameClientMountListener>();

export function getMountedGameClient(): GameClient | null {
  return mountedClient;
}

export function requireMountedGameClient(): GameClient {
  if (!mountedClient) {
    throw new Error("GameClient is not mounted yet");
  }
  return mountedClient;
}

export function onGameClientMounted(listener: GameClientMountListener): () => void {
  mountListeners.add(listener);
  if (mountedClient) {
    listener(mountedClient);
  }
  return () => {
    mountListeners.delete(listener);
  };
}

export function setMountedGameClient(client: GameClient | null): void {
  mountedClient = client;
  if (!client) return;
  for (const listener of mountListeners) {
    listener(client);
  }
}

export function clearMountedGameClient(): void {
  mountedClient = null;
}
