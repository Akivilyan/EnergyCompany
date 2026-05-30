/** 微信小游戏 hide 生命周期最小端口，便于单测注入 fake。 */
export interface WxHideLifecyclePort {
  onHide(listener: () => void): void;
  offHide?(listener: () => void): void;
}

export function resolveWxHideLifecyclePort(): WxHideLifecyclePort | null {
  const candidate = (globalThis as { wx?: Partial<WxHideLifecyclePort> }).wx;
  if (!candidate || typeof candidate.onHide !== "function") return null;
  return candidate as WxHideLifecyclePort;
}
