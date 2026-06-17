/** 深拷贝；微信小游戏等环境无 structuredClone 时回退 JSON。 */
export function deepClone<T>(value: T): T {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}
