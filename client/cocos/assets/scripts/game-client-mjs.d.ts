declare module "*.mjs" {
  export type ConfigBundleInput = any;

  export class ConfigRepo {
    static fromBundle(input: unknown): ConfigRepo;
  }

  export const V0_CONFIG_JSON_FILES: Record<string, string>;
  export const V0_CONFIG_RESOURCE_BASE: string;
  export function buildConfigBundle(input: ConfigBundleInput): unknown;
  export function mountGameClient(options: any): any;
  export function clearMountedGameClient(): void;
  export function ensureChineseDefaultForDev(): void;
}
