import {
  resolveWxHideLifecyclePort,
  type WxHideLifecyclePort
} from "../infra/lifecycle/wxLifecycle.js";
import {
  DEFAULT_CLIENT_RUN_SLOT,
  persistClientRun,
  type ClientPersistResult,
  type ClientPlayPersistence
} from "./clientPersistence.js";

export interface ClientAutoSaveOnHideOptions {
  slotId?: string;
  lifecycle?: WxHideLifecyclePort | null;
  onPersist?: (result: ClientPersistResult) => void;
}

export interface ClientAutoSaveBinding {
  slotId: string;
  bound: boolean;
  unbind: () => void;
}

export function bindClientAutoSaveOnHide(
  play: ClientPlayPersistence,
  options: ClientAutoSaveOnHideOptions = {}
): ClientAutoSaveBinding {
  const slotId = options.slotId ?? DEFAULT_CLIENT_RUN_SLOT;
  const lifecycle = options.lifecycle ?? resolveWxHideLifecyclePort();
  if (!lifecycle) {
    return { slotId, bound: false, unbind: () => {} };
  }

  const handler = () => {
    const result = persistClientRun(play, slotId);
    options.onPersist?.(result);
  };
  lifecycle.onHide(handler);
  return {
    slotId,
    bound: true,
    unbind: () => {
      lifecycle.offHide?.(handler);
    }
  };
}
