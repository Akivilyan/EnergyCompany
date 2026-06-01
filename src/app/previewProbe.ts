/** 探测 Cocos 内置浏览器预览 HTTP 是否可达。 */
const DEFAULT_PREVIEW_URL = "http://127.0.0.1:7456/";
const TIMEOUT_MS = 4_000;

export function previewUrlFromEnv(): string {
  const raw = process.env.COCOS_PREVIEW_URL?.trim();
  return raw && raw.length > 0 ? raw : DEFAULT_PREVIEW_URL;
}

export async function probeCocosPreview(
  url: string = previewUrlFromEnv(),
  timeoutMs: number = TIMEOUT_MS
): Promise<{ ok: true; status: number; url: string } | { ok: false; reason: string; url: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow"
    });
    if (!response.ok) {
      return {
        ok: false,
        url,
        reason: `HTTP ${response.status} ${response.statusText}`
      };
    }
    return { ok: true, url, status: response.status };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "AbortError"
        ? `timeout after ${timeoutMs}ms`
        : error instanceof Error
          ? error.message
          : String(error);
    return { ok: false, url, reason };
  } finally {
    clearTimeout(timer);
  }
}
