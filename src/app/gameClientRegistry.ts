import type { GameBootstrap } from "./gameBootstrap.js";

type GameClientMountListener = (boot: GameBootstrap) => void;

let mountedBoot: GameBootstrap | null = null;
const mountListeners = new Set<GameClientMountListener>();

export function getMountedGameClient(): GameBootstrap | null {
  return mountedBoot;
}

export function requireMountedGameClient(): GameBootstrap {
  if (!mountedBoot) {
    throw new Error("GameClient is not mounted yet");
  }
  return mountedBoot;
}

export function onGameClientMounted(listener: GameClientMountListener): () => void {
  mountListeners.add(listener);
  if (mountedBoot) {
    listener(mountedBoot);
  }
  return () => {
    mountListeners.delete(listener);
  };
}

export function setMountedGameClient(boot: GameBootstrap | null): void {
  mountedBoot = boot;
  if (!boot) return;
  for (const listener of mountListeners) {
    listener(boot);
  }
}

export function clearMountedGameClient(): void {
  mountedBoot = null;
}
