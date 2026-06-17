declare const process: {
  cwd(): string;
  env: Record<string, string | undefined>;
  argv: string[];
  stdout: {
    write(chunk: string): boolean;
  };
  exit(code?: number): never;
};

declare module "node:path" {
  const path: any;
  export = path;
}

declare module "node:fs" {
  export function mkdirSync(path: string, options?: any): any;
  export function writeFileSync(path: string, data: string, options?: any): void;
  const fs: any;
  export = fs;
}

declare module "node:child_process" {
  export function execSync(command: string, options?: any): any;
}
